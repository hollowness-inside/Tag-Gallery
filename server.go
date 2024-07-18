package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type Item struct {
	Path string   `json:"path"`
	Tags []string `json:"tags"`
}

func fetchItems(w http.ResponseWriter, r *http.Request) {
	println("Works")
	if r.Method != "GET" {
		return
	}

	var item []Item
	item = append(item, Item{
		Path: "images/adam-bignell-BTrpO01nqK8-unsplash.jpg",
		Tags: []string{"architecture", "sky"},
	})

	item = append(item, Item{
		Path: "images/aedrian-salazar-7gBwDz_9AzI-unsplash.jpg",
		Tags: []string{
			"plant",
			"nature",
			"sky",
		},
	})

	jitems, _ := json.Marshal(item)
	w.Write(jitems)
}

func main() {
	fs := http.FileServer(http.Dir("./src"))
	http.Handle("/", fs)

	http.HandleFunc("/fetch", fetchItems)

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}
