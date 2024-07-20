package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	// Ensure the vault directory exists
	if err := os.MkdirAll("../web/vault/", os.ModePerm); err != nil {
		log.Fatalf("Failed to create vault directory: %v", err)
	}

	// Initialize the database
	var err error
	db, err = initDB("../vault.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()

	// Set up the HTTP server
	static := http.FileServer(http.Dir("../web"))
	http.Handle("/", static)

	http.HandleFunc("/fetch", fetchItems)
	http.HandleFunc("/upload", uploadItem)

	log.Println("Server is starting at :8080")
	if err = http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
