package com.ctrlz.huhu

import android.os.Bundle
import androidx.core.view.WindowCompat
import io.flutter.embedding.android.FlutterActivity

class MainActivity : FlutterActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Android 15+ edge-to-edge default; Flutter SafeArea handles insets.
        WindowCompat.setDecorFitsSystemWindows(window, false)
    }
}
