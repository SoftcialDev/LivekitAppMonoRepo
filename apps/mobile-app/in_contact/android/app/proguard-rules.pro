# Microsoft Identity Library - ignore missing FindBugs annotations
-dontwarn edu.umd.cs.findbugs.annotations.**
-dontwarn com.microsoft.identity.common.**

# BouncyCastle FIPS - ignore if not using FIPS mode
-dontwarn org.bouncycastle.jcajce.provider.BouncyCastleFipsProvider

# Keep Microsoft Identity classes that might be needed
-keep class com.microsoft.identity.** { *; }

# Keep annotation interfaces
-keepattributes *Annotation*

# Microsoft Identity Library - ignore missing FindBugs annotations
-dontwarn edu.umd.cs.findbugs.annotations.**
-dontwarn com.microsoft.identity.common.**

# BouncyCastle - keep all classes as they're needed for JWT operations
-keep class org.bouncycastle.** { *; }
-dontwarn org.bouncycastle.**

# Nimbus JOSE + JWT library
-keep class com.nimbusds.** { *; }
-dontwarn com.nimbusds.**

# Keep Microsoft Identity classes that might be needed
-keep class com.microsoft.identity.** { *; }

# Keep annotation interfaces
-keepattributes *Annotation*