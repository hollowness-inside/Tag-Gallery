package main

import (
	"io"

	"github.com/gabriel-vasile/mimetype"
)

func readerToMimetype(reader io.ReadSeeker) (string, error) {
	mt, err := mimetype.DetectReader(reader)
	if err != nil {
		return "", err
	}
	reader.Seek(0, 0)
	return mt.String(), nil
}
