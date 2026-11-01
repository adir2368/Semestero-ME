package com.technion.semestero;

import android.util.Log;
import com.google.android.gms.wearable.MessageEvent;
import com.google.android.gms.wearable.WearableListenerService;

/**
 * PhoneWearListenerService • Listens for sync requests and actions dispatched from Galaxy Watch.
 */
public class PhoneWearListenerService extends WearableListenerService {
    private static final String TAG = "PhoneWearListener";
    public static final String PATH_REQUEST_SYNC = "/semestero/request_sync";

    @Override
    public void onMessageReceived(MessageEvent messageEvent) {
        if (messageEvent == null) return;
        String path = messageEvent.getPath();
        Log.d(TAG, "Wear OS message received on path: " + path);

        if (PATH_REQUEST_SYNC.equals(path)) {
            Log.d(TAG, "Galaxy Watch requested immediate data sync. Pushing full dataset to watch...");
            WearSyncManager.syncAllToWatch(this);
        }
    }
}
