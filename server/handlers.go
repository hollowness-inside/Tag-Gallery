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

// Fetch items from the vault table and return them as JSON
func fetchItems(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var count int
	if err := db.QueryRow("SELECT COUNT(*) FROM vault").Scan(&count); err != nil {
		log.Fatalf("Failed to count items: %v", err)
	}

	items := make([]Item, 0, count)
	rows, err := db.Query("SELECT id, extension, directory, type, tags FROM vault")
	if err != nil {
		log.Fatalf("Failed to fetch items: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var item Item
		var tagsJSON string
		if err := rows.Scan(&item.Id, &item.Ext, &item.Dir, &item.Mimetype, &tagsJSON); err != nil {
			log.Fatalf("Failed to scan item: %v", err)
		}

		if err := json.Unmarshal([]byte(tagsJSON), &item.Tags); err != nil {
			log.Fatalf("Failed to unmarshal tags: %v", err)
		}

		items = append(items, item)
	}

	responseJSON, err := json.Marshal(items)
	if err != nil {
		log.Fatalf("Failed to marshal items to JSON: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(responseJSON)
}

// Handle file upload and save the file metadata to the database
func uploadItem(w http.ResponseWriter, r *http.Request) {
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
	nextID := addItem(fileExt, mimeRoot, mime, tags)
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
