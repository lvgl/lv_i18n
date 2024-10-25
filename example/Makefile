example: clean compile main

example-optimized: clean compile-optimized main

extract:
	../lv_i18n.js extract -s main.c -t "translations/*.yml"

compile:
	../lv_i18n.js compile -l en-GB -t "translations/*.yml" -o .
	ls -l
	tree

compile-optimized:
	../lv_i18n.js compile --optimize -l en-GB -t "translations/*.yml" -o .

main: main.o lv_i18n.o
	$(CC) -o main main.o lv_i18n.o

clean:
	rm -f main main.o lv_i18n.o

distclean: clean
	rm -f lv_i18n.c lv_i18n.h *~
