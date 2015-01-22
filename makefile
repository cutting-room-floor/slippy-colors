build: ; npm install; mkdir -p bin; browserify -d ./demo.js -o ./bin/demo.js

clean: ; rm -rf ./bin/*
