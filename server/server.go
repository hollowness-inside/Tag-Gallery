package main

import (
	"encoding/json"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"

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
	http.HandleFunc("/vault/*", server.accessVault)
	http.HandleFunc("/thumb/*", server.accessThumb)

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

	var tags []string
	jtags := form.Get("tags").First()
	json.Unmarshal([]byte(jtags), &tags)

	file := form.GetFile("file").First()
	if file == nil {
		log.Fatal("No file to upload")
	}

	reader, err := file.Open()
	if err != nil {
		log.Fatalf("Failed to open uploaded file: %v", err)
	}
	defer reader.Close()

	mime, err := readerToMimetype(reader)
	if err != nil {
		log.Fatalf("Couldn't determine mimetype: %v", err)
	}

	ext := filepath.Ext(file.Filename)

	itemId, err := server.vault.UploadItem(ext, mime, tags, reader)
	if err != nil {
		log.Fatalf("Failed to upload file: %v", err)
	}

	w.Write([]byte(strconv.Itoa(itemId)))
}

func (server *Server) accessVault(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	path := strings.Split(r.URL.String(), "/")
	idStr := path[len(path)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Wrong id", http.StatusBadRequest)
		return
	}

	content, contentType, err := server.vault.GetItem(id)
	if err != nil {
		log.Fatalf("%v", err)
		return
	}

	w.Header().Set("content-type", contentType)
	w.Write(content)
}

func (server *Server) accessThumb(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	path := strings.Split(r.URL.String(), "/")
	idStr := path[len(path)-1]
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Wrong id", http.StatusBadRequest)
		return
	}

	content, contentType, err := server.vault.GetThumbnail(id)
	if err != nil {
		log.Fatalf("%v", err)
		return
	}

	w.Header().Set("content-type", contentType)
	w.Write(content)
}
