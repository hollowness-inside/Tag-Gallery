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
	Path string   `json:"path"`
	Tags []string `json:"tags"`
}

func initDB(path string) (*sql.DB, error) {
	conn, err := sql.Open("sqlite3", path)
	if err != nil {
		return nil, err
	}

	if _, err = conn.Exec(`CREATE TABLE IF NOT EXISTS vault (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT NOT NULL,
                name STR(128) NOT NULL,
                type TEXT,
                tags TEXT);`); err != nil {
		return nil, err
	}

	return conn, nil
}

func getNextId() int {
	var lastid int
	err := db.QueryRow("SELECT seq FROM sqlite_sequence WHERE name=\"vault\"").Scan(&lastid)
	if err == sql.ErrNoRows {
		return 1
	}

	if err != nil {
		log.Fatal(err)
	}

	return lastid + 1
}

func addItem(path, name, typ string, jtags string) {
	_, err := db.Exec("INSERT INTO vault (path, name, type, tags) VALUES (?, ?, ?, ?)", path, name, typ, jtags)
	if err != nil {
		log.Fatal(err)
	}
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
	rows, err := db.Query("SELECT name, tags FROM vault")
	if err != nil {
		log.Fatal(err)
	}

	for rows.Next() {
		var fname, jtags string
		rows.Scan(&fname, &jtags)

		var tags []string
		json.Unmarshal([]byte(jtags), &tags)

		item := Item{fname, tags}
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

	reader, err := file.Open()
	if file == nil || err != nil {
		log.Fatal(err)
	}

	_mimetype, err := mimetype.DetectReader(reader)
	if err != nil {
		log.Fatal(err)
	}
	mime := _mimetype.String()
	mimeRoot := strings.Split(mime, "/")[0]
	reader.Seek(0, 0)

	fname := strconv.Itoa(getNextId())
	fext := path.Ext(file.Filename)
	fname = fname + fext

	dirPath := path.Join("./src/vault/", mimeRoot)
	if err := os.MkdirAll(dirPath, os.ModePerm); err != nil {
		log.Fatal(err)
	}

	fpath := path.Join(dirPath, fname)
	fout, err := os.Create(fpath)
	if err != nil {
		log.Fatal(err)
	}

	fout.ReadFrom(reader)
	addItem(path.Join(mimeRoot, fname), fname, mime, tags)
}

func main() {
	if err := os.MkdirAll("./vault/", os.ModePerm); err != nil {
		log.Fatal(err)
	}

	var err error
	db, err = initDB("vault.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	static := http.FileServer(http.Dir("./src"))
	vault := http.FileServer(http.Dir("./vault"))

	http.Handle("/", static)
	http.Handle("/vault", vault)

	http.HandleFunc("/fetch", fetchItems)
	http.HandleFunc("/upload", uploadItem)

	if err = http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
