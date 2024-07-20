package main

import (
	"database/sql"
	"encoding/json"
	"io"
	"os"
	"path"
	"strconv"
	"strings"

	_ "github.com/mattn/go-sqlite3"
)

type DbVault struct {
	dirPath string
	db      *sql.DB
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

	return &DbVault{dirPath, db}, nil
}

func (v *DbVault) UploadItem(extension string, mime string, tags []string, reader io.ReadSeeker) (err error) {
	mimeRoot := strings.Split(mime, "/")[0]
	reader.Seek(0, 0)

	dirPath := path.Join(v.dirPath, mimeRoot)
	if err = os.MkdirAll(dirPath, os.ModePerm); err != nil {
		return
	}

	jtags, _ := json.Marshal(tags)
	nextID, err := v.addItem(extension, mimeRoot, mime, jtags)
	if err != nil {
		return
	}
	fileName := strconv.FormatInt(nextID, 10) + extension
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
