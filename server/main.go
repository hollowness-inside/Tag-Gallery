package main

import "log"

func main() {
	vault, err := NewPlainVault("../vault/", "../vault/vault.db")
	if err != nil {
		log.Fatal("Cannot create DbVault: ", err)
	}
	defer vault.Close()

	server := NewServer("../web", vault)

	server.serve(":8080")
}
