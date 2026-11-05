with open('android/wear/src/main/java/com/technion/semestero/wear/WearCarouselAdapter.java', 'r', encoding='utf-8') as f:
    text = f.read()

idx1 = text.find("private void bindSync(SyncViewHolder h)")
print("bindSync block:")
print(ascii(text[idx1:idx1+700]))

idx2 = text.find("public static class SyncViewHolder extends RecyclerView.ViewHolder")
print("\nSyncViewHolder block:")
print(ascii(text[idx2:idx2+650]))
