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

type PlainVault struct {
	dirPath string
	db      *sql.DB
}

func NewPlainVault(dirPath, dbPath string) (*PlainVault, error) {
	err := os.MkdirAll(dirPath, os.ModePerm)
	if err != nil {
		return nil, err
	}

	db, err := initDB(dbPath)
	if err != nil {
		return nil, err
	}

	return &PlainVault{dirPath, db}, nil
}

func (vault *PlainVault) GetItem(id int) ([]byte, string, error) {
	var ext, mimetype, directory string

	req := vault.db.QueryRow("SELECT extension, type, directory FROM vault WHERE id = ?", id)
	err := req.Scan(&ext, &mimetype, &directory)
	if err != nil {
		return nil, "", err
	}

	idStr := strconv.Itoa(id)

	fpath := path.Join(vault.dirPath, directory, idStr+ext)
	bytes, err := os.ReadFile(fpath)
	if err != nil {
		return nil, "", err
	}

	return bytes, mimetype, nil
}

func (vault *PlainVault) GetThumbnail(id int) ([]byte, string, error) {
	var ext, mimetype, directory string

	req := vault.db.QueryRow("SELECT extension, type, directory FROM vault WHERE id = ?", id)
	err := req.Scan(&ext, &mimetype, &directory)
	if err != nil {
		return nil, "", err
	}

	idStr := strconv.Itoa(id)

	fpath := path.Join(vault.dirPath, directory, idStr+ext)
	bytes, err := os.ReadFile(fpath)
	if err != nil {
		return nil, "", err
	}

	return bytes, mimetype, nil
}

func (vault *PlainVault) UploadItem(extension string, mime string, tags []string, reader io.ReadSeeker) (err error) {
	mimeRoot := strings.Split(mime, "/")[0]
	reader.Seek(0, 0)

	dirPath := path.Join(vault.dirPath, mimeRoot)
	if err = os.MkdirAll(dirPath, os.ModePerm); err != nil {
		return
	}

	jtags, _ := json.Marshal(tags)
	nextID, err := vault.addItem(extension, mimeRoot, mime, jtags)
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

func (vault *PlainVault) GetItems() ([]Item, error) {
	var count int
	err := vault.db.QueryRow("SELECT COUNT(*) FROM vault").Scan(&count)
	if err != nil {
		return nil, err
	}

	items := make([]Item, 0, count)
	rows, err := vault.db.Query("SELECT id, extension, directory, type, tags FROM vault")
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

func (vault *PlainVault) Close() error {
	return vault.db.Close()
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

func (vault *PlainVault) addItem(extension, directory, fileType string, tagsJSON []byte) (int64, error) {
	result, err := vault.db.Exec("INSERT INTO vault (extension, directory, type, tags) VALUES (?, ?, ?, ?)", extension, directory, fileType, tagsJSON)
	if err != nil {
		return 0, err
	}

	rowID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return rowID, nil
}
