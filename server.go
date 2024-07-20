package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path"
	"strconv"
	"strings"

	"github.com/gabriel-vasile/mimetype"
	_ "github.com/mattn/go-sqlite3"
	"github.com/neox5/go-formdata"
)

var db *sql.DB

type Item struct {
	Id       int64    `json:"id"`
	Ext      string   `json:"extension"`
	Dir      string   `json:"directory"`
	Mimetype string   `json:"type"`
	Tags     []string `json:"tags"`
}

func initDB(path string) (*sql.DB, error) {
	conn, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}

	if _, err = conn.Exec(`CREATE TABLE IF NOT EXISTS vault (
				id INTEGER UNIQUE PRIMARY KEY AUTOINCREMENT,
				extension STR(10),
                directory TEXT NOT NULL,
                type TEXT,
                tags TEXT);`); err != nil {
		return nil, err
	}

	return conn, nil
}

func addItem(ext, dir, typ string, jtags string) int64 {
	result, err := db.Exec("INSERT INTO vault (extension, directory, type, tags) VALUES (?, ?, ?, ?)", ext, dir, typ, jtags)
	if err != nil {
		log.Fatal(err)
	}

	rowid, err := result.LastInsertId()
	if err != nil {
		log.Fatal(err)
	}

	return rowid
}

func fetchItems(w http.ResponseWriter, r *http.Request) {
	if r.Method != "GET" {
		return
	}

	var count int
	err := db.QueryRow("SELECT COUNT(*) FROM vault").Scan(&count)
	if err != nil {
		log.Fatal(err)
	}

	items := make([]Item, 0, count)
	rows, err := db.Query("SELECT id, extension, directory, type, tags FROM vault")
	if err != nil {
		log.Fatal(err)
	}

	for rows.Next() {
		var id int64
		var ext, dir, mtype, jtags string
		rows.Scan(&id, &ext, &dir, &mtype, &jtags)

		var tags []string
		json.Unmarshal([]byte(jtags), &tags)

		item := Item{id, ext, dir, mtype, tags}
		items = append(items, item)
	}

	jitems, _ := json.Marshal(items)
	w.Write(jitems)
}

func uploadItem(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		return
	}

	fd, err := formdata.Parse(r)
	if err != nil {
		log.Fatal(err)
	}

	tags := fd.Get("tags").First()
	file := fd.GetFile("file").First()

	if file == nil {
		log.Fatal("No item to upload", file)
	}

	reader, err := file.Open()
	if file == nil || err != nil {
		log.Fatal(err)
	}
	defer reader.Close()

	_mimetype, err := mimetype.DetectReader(reader)
	if err != nil {
		log.Fatal(err)
	}
	mime := _mimetype.String()
	mimeRoot := strings.Split(mime, "/")[0]
	reader.Seek(0, 0)

	dirPath := path.Join("./src/vault/", mimeRoot)
	if err := os.MkdirAll(dirPath, os.ModePerm); err != nil {
		log.Fatal(err)
	}

	fext := path.Ext(file.Filename)

	nextid := addItem(fext, mimeRoot, mime, tags)
	fname := strconv.FormatInt(nextid, 10)
	fname = fname + fext

	fpath := path.Join(dirPath, fname)
	fout, err := os.Create(fpath)
	if err != nil {
		log.Fatal(err)
	}
	defer fout.Close()

	fout.ReadFrom(reader)
}

func main() {
	if err := os.MkdirAll("./src/vault/", os.ModePerm); err != nil {
		log.Fatal(err)
	}

	var err error
	db, err = initDB("vault.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	static := http.FileServer(http.Dir("./src"))
	http.Handle("/", static)

	http.HandleFunc("/fetch", fetchItems)
	http.HandleFunc("/upload", uploadItem)

	if err = http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
