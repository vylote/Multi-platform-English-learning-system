plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.els.app"
    compileSdk {
        version = release(36) {
            minorApiLevel = 1
        }
    }

    buildFeatures {
        buildConfig = true
    }

    defaultConfig {
        applicationId = "com.els.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        getByName("debug") {
            buildConfigField("String", "BASE_URL", "\"http://10.0.2.2:5000/api/v1/\"")
        }
        release {
            buildConfigField("String", "BASE_URL", "\"https://api.yourdomain.com/api/v1/\"")
            optimization {
                enable = true   // đã sửa: bật minify/shrink cho bản release
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17   // đã sửa: đồng bộ theo yêu cầu AGP 9
        targetCompatibility = JavaVersion.VERSION_17
    }
}

dependencies {
    // ------------------------------------------
    // 1. Thư viện cơ bản & Material Design UI
    // ------------------------------------------
    implementation(libs.appcompat)
    implementation(libs.constraintlayout)
    implementation(libs.material)
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")

    testImplementation(libs.junit)
    androidTestImplementation(libs.espresso.core)
    androidTestImplementation(libs.ext.junit)

    // ------------------------------------------
    // 2. Lombok — PHẢI khai báo trước Room/MapStruct
    //    để annotation processor xử lý getter/setter trước
    // ------------------------------------------
    implementation("org.projectlombok:lombok:1.18.46")
    annotationProcessor("org.projectlombok:lombok:1.18.46")

    // ------------------------------------------
    // 3. Room Database (SQLite Offline) — dự án Java dùng annotationProcessor
    // ------------------------------------------
    val roomVersion = "2.8.4"
    implementation("androidx.room:room-runtime:$roomVersion")
    annotationProcessor("androidx.room:room-compiler:$roomVersion")

    // ------------------------------------------
    // 4. MapStruct — cần binding để tương thích với Lombok
    // ------------------------------------------
    implementation("org.mapstruct:mapstruct:1.6.3")
    annotationProcessor("org.mapstruct:mapstruct-processor:1.6.3")
    annotationProcessor("org.projectlombok:lombok-mapstruct-binding:0.2.0")

    // ------------------------------------------
    // 5. Retrofit API Client
    // ------------------------------------------
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
}