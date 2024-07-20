package main

import (
	"database/sql"
	"encoding/json"
	"io"
	"os"
	"path"
	"strconv"
	"strings"

	"github.com/gabriel-vasile/mimetype"
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

func (v *DbVault) UploadItem(filename string, tags []string, reader io.ReadSeeker) (err error) {
	mimeType, err := mimetype.DetectFile(filename)
	// mimeType, err := mimetype.DetectReader(reader)
	if err != nil {
		return
	}
	mime := mimeType.String()
	mimeRoot := strings.Split(mime, "/")[0]
	reader.Seek(0, 0)

	dirPath := path.Join("../web/vault/", mimeRoot)
	if err = os.MkdirAll(dirPath, os.ModePerm); err != nil {
		return
	}

	jtags, _ := json.Marshal(tags)
	fileExt := path.Ext(filename)
	nextID, err := v.addItem(fileExt, mimeRoot, mime, jtags)
	if err != nil {
		return
	}
	fileName := strconv.FormatInt(nextID, 10) + fileExt
	filePath := path.Join(dirPath, fileName)

	outFile, err := os.Create(filePath)
	if err != nil {
		return
	}
	defer outFile.Close()

	if _, err = outFile.ReadFrom(reader); err != nil {
		return
	}

	return
}

func (v *DbVault) addItem(extension, directory, fileType string, tagsJSON []byte) (int64, error) {
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
