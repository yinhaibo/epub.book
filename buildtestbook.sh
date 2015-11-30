#/bin/sh
cd www/books/testbook/
zip -r testbook.epub *
mv testbook.epub ../
cd ..
rm -r ./testbook
