package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	_ "github.com/mattn/go-sqlite3"
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
                name STR(128) NOT NULL PRIMARY KEY,
                path TEXT NOT NULL,
                type STR(5),
                tags TEXT);`); err != nil {
		return nil, err
	}

	return conn, nil
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
	rows, err := db.Query("SELECT path, tags FROM vault")
	if err != nil {
		log.Fatal(err)
	}

	for rows.Next() {
		var path, jtags string
		rows.Scan(&path, &jtags)

		var tags []string
		json.Unmarshal([]byte(jtags), &tags)

		item := Item{path, tags}
		items = append(items, item)
	}

	jitems, _ := json.Marshal(items)
	w.Write(jitems)
}

func main() {

	var err error
	db, err = initDB("vault.db")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	fs := http.FileServer(http.Dir("./src"))
	http.Handle("/", fs)
	http.HandleFunc("/fetch", fetchItems)

	if err = http.ListenAndServe(":8080", nil); err != nil {
		log.Fatal(err)
	}
}
