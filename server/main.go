package main

import "log"

func main() {
	dbVault, err := NewPlainVault("../vault/", "../vault/vault.db")
	if err != nil {
		log.Fatal("Cannot create DbVault: ", err)
	}
	defer dbVault.Close()

	server := NewServer("../web", dbVault)

	server.serve(":8080")
}
