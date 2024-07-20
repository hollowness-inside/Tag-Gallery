package main

import (
	"database/sql"
	"log"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

// Initialize the database and create the vault table if it does not exist
func initDB(path string) (*sql.DB, error) {
	conn, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}

	query := `CREATE TABLE IF NOT EXISTS vault (
				id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT,
				extension STR(10),
				directory TEXT NOT NULL,
				type TEXT,
				tags TEXT
			);`

	if _, err = conn.Exec(query); err != nil {
		return nil, err
	}

	return conn, nil
}

// Add a new item to the vault table
func addItem(extension, directory, fileType, tagsJSON string) int64 {
	result, err := db.Exec("INSERT INTO vault (extension, directory, type, tags) VALUES (?, ?, ?, ?)", extension, directory, fileType, tagsJSON)
	if err != nil {
		log.Fatalf("Failed to add item to the database: %v", err)
	}

	rowID, err := result.LastInsertId()
	if err != nil {
		log.Fatalf("Failed to get last insert ID: %v", err)
	}

	return rowID
}
