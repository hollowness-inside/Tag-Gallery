package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"

	"github.com/gabriel-vasile/mimetype"
	"github.com/neox5/go-formdata"
)

type Server struct {
	static string
	vault  Vault
}

func NewServer(static string, vault Vault) Server {
	return Server{static, vault}
}

func (server *Server) serve(addr string) error {
	static := http.FileServer(http.Dir(server.static))

	http.Handle("/", static)
	http.HandleFunc("/fetch", server.fetchItems)
	http.HandleFunc("/upload", server.uploadItem)

	log.Println("Server is starting at ", addr)
	return http.ListenAndServe(addr, nil)
}

// Fetch items from the vault table and return them as JSON
func (server *Server) fetchItems(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	items, _ := server.vault.GetItems()
	responseJSON, err := json.Marshal(items)
	if err != nil {
		log.Fatalf("Failed to marshal items to JSON: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(responseJSON)
}

// Handle file upload and save the file metadata to the database
func (server *Server) uploadItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	form, err := formdata.Parse(r)
	if err != nil {
		log.Fatalf("Failed to parse form data: %v", err)
	}

	tags := form.Get("tags").First()
	file := form.GetFile("file").First()

	if file == nil {
		log.Fatal("No file to upload")
	}

	reader, err := file.Open()
	if err != nil {
		log.Fatalf("Failed to open uploaded file: %v", err)
	}
	defer reader.Close()

	mimeType, err := mimetype.DetectReader(reader)
	if err != nil {
		log.Fatalf("Failed to detect MIME type: %v", err)
	}
	mime := mimeType.String()
	mimeRoot := strings.Split(mime, "/")[0]
	reader.Seek(0, 0)

	dirPath := path.Join("../web/vault/", mimeRoot)
	if err := os.MkdirAll(dirPath, os.ModePerm); err != nil {
		log.Fatalf("Failed to create directory: %v", err)
	}

	fileExt := path.Ext(file.Filename)
	nextID, err := server.vault.AddItem(fileExt, mimeRoot, mime, tags)
	if err != nil {
		log.Fatalf("Couldn't add item: %v", err)
	}
	fileName := strconv.FormatInt(nextID, 10) + fileExt
	filePath := path.Join(dirPath, fileName)

	outFile, err := os.Create(filePath)
	if err != nil {
		log.Fatalf("Failed to create file: %v", err)
	}
	defer outFile.Close()

	if _, err = outFile.ReadFrom(reader); err != nil {
		log.Fatalf("Failed to save file: %v", err)
	}
}
