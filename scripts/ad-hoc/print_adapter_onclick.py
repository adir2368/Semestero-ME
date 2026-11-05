with open('android/wear/src/main/java/com/technion/semestero/wear/WearCarouselAdapter.java', 'r', encoding='utf-8') as f:
    text = f.read()

idx1 = text.find("h.btnTriggerSync.setOnClickListener")
print(ascii(text[idx1:idx1+300]))
