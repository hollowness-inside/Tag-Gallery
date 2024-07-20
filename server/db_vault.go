package main

import (
	"database/sql"
	"encoding/json"
	"os"

	_ "github.com/mattn/go-sqlite3"
)

type DbVault struct {
	db *sql.DB
}

func NewDbVault(dirPath, dbPath string) (*DbVault, error) {
	err := os.MkdirAll(dirPath, os.ModePerm)
	if err != nil {
		return nil, err
	}

	db, err := initDB(dbPath)
	if err != nil {
		return nil, err
	}

	return &DbVault{db}, nil
}

func (v *DbVault) AddItem(extension, directory, fileType, tagsJSON string) (int64, error) {
	result, err := v.db.Exec("INSERT INTO vault (extension, directory, type, tags) VALUES (?, ?, ?, ?)", extension, directory, fileType, tagsJSON)
	if err != nil {
		return 0, err
	}

	rowID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return rowID, nil
}

func (v *DbVault) GetItems() ([]Item, error) {
	var count int
	err := v.db.QueryRow("SELECT COUNT(*) FROM vault").Scan(&count)
	if err != nil {
		return nil, err
	}

	items := make([]Item, 0, count)
	rows, err := v.db.Query("SELECT id, extension, directory, type, tags FROM vault")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var item Item
		var tagsJSON string
		if err := rows.Scan(&item.Id, &item.Ext, &item.Dir, &item.Mimetype, &tagsJSON); err != nil {
			return nil, err
		}

		if err := json.Unmarshal([]byte(tagsJSON), &item.Tags); err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	return items, nil
}

func (v *DbVault) Close() error {
	return v.db.Close()
}

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
