11:55:47.445 Running build in Washington, D.C., USA (East) – iad1
11:55:47.445 Build machine configuration: 4 cores, 8 GB
11:55:47.462 Cloning github.com/rdjerrouf/marketdz (Branch: main, Commit: 9a47b73)
11:55:47.469 Skipping build cache, deployment was triggered without cache.
11:55:48.279 Cloning completed: 816.000ms
11:55:48.634 Running "vercel build"
11:55:49.044 Vercel CLI 48.2.9
11:55:49.814 Running "install" command: `npm install`...
11:55:52.995 npm warn deprecated sourcemap-codec@1.4.8: Please use @jridgewell/sourcemap-codec instead
11:55:53.176 npm warn deprecated rollup-plugin-terser@7.0.2: This package has been deprecated and is no longer maintained. Please use @rollup/plugin-terser
11:55:53.207 npm warn deprecated rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported
11:55:53.922 npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
11:55:54.041 npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
11:55:54.993 npm warn deprecated @supabase/auth-helpers-shared@0.7.0: This package is now deprecated - please use the @supabase/ssr package instead.
11:55:55.203 npm warn deprecated @supabase/auth-helpers-react@0.5.0: This package is now deprecated - please use the @supabase/ssr package instead.
11:55:55.786 npm warn deprecated @supabase/auth-helpers-nextjs@0.10.0: This package is now deprecated - please use the @supabase/ssr package instead.
11:55:56.739 npm warn deprecated source-map@0.8.0-beta.0: The work that was done in this beta branch won't be included in future versions
11:55:56.771 npm warn deprecated workbox-cacheable-response@6.6.0: workbox-background-sync@6.6.0
11:55:56.791 npm warn deprecated workbox-google-analytics@6.6.0: It is not compatible with newer versions of GA starting with v4, as long as you are using GAv3 it should be ok, but the package is not longer being maintained
11:55:56.814 npm warn deprecated source-map@0.8.0-beta.0: The work that was done in this beta branch won't be included in future versions
11:56:07.506 
11:56:07.506 added 801 packages in 17s
11:56:07.506 
11:56:07.506 171 packages are looking for funding
11:56:07.506   run `npm fund` for details
11:56:07.871 Detected Next.js version: 15.5.2
11:56:07.872 Running "npm run build"
11:56:08.001 
11:56:08.001 > marketdz@0.1.0 build
11:56:08.001 > next build --turbopack
11:56:08.001 
11:56:09.711 Attention: Next.js now collects completely anonymous telemetry regarding usage.
11:56:09.712 This information is used to shape Next.js' roadmap and prioritize features.
11:56:09.712 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
11:56:09.712 https://nextjs.org/telemetry
11:56:09.712 
11:56:09.838    ▲ Next.js 15.5.2 (Turbopack)
11:56:09.838 
11:56:10.119    Creating an optimized production build ...
11:56:11.341  ⚠ Webpack is configured while Turbopack is not, which may cause problems.
11:56:11.342  ⚠ See instructions if you need to configure Turbopack:
11:56:11.342   https://nextjs.org/docs/app/api-reference/next-config-js/turbopack
11:56:11.342 
11:56:19.668  ✓ Finished writing to disk in 40ms
11:56:19.715  ✓ Compiled successfully in 8.4s
11:56:19.720    Linting and checking validity of types ...
11:56:26.856 
11:56:26.856 ./src/app/(auth)/forgot-password/page.tsx
11:56:26.856 17:9  Warning: 'router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.856 125:20  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.857 125:66  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.857 240:20  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.857 
11:56:26.857 ./src/app/(auth)/signin/page.tsx
11:56:26.857 114:21  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.857 274:20  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.857 
11:56:26.857 ./src/app/(auth)/signup/page.tsx
11:56:26.857 8:10  Warning: 'supabase' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.858 
11:56:26.858 ./src/app/add-item/page.tsx
11:56:26.858 61:45  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.859 82:15  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.859 389:43  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.859 
11:56:26.859 ./src/app/admin/admins/page.tsx
11:56:26.859 4:10  Warning: 'supabase' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.859 
11:56:26.859 ./src/app/admin/analytics/page.tsx
11:56:26.859 36:6  Warning: React Hook useEffect has a missing dependency: 'fetchAnalyticsData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.859 93:86  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.860 207:61  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.860 
11:56:26.860 ./src/app/admin/layout.tsx
11:56:26.860 7:32  Warning: 'getAdminUser' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.860 7:66  Warning: 'verifyAdminSession' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.860 27:36  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.860 41:6  Warning: React Hook useEffect has missing dependencies: 'checkAdminAccess' and 'checkSessionExpiry'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.860 117:74  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.861 188:9  Warning: 'createNewAdminSession' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.861 399:59  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.861 
11:56:26.861 ./src/app/admin/listings/page.tsx
11:56:26.861 7:11  Warning: 'Listing' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.861 20:13  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.861 29:44  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.861 41:6  Warning: React Hook useEffect has a missing dependency: 'fetchListings'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.862 91:25  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.862 254:66  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.862 361:43  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.864 
11:56:26.864 ./src/app/admin/logs/page.tsx
11:56:26.864 13:13  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.865 292:64  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.865 307:72  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.865 323:68  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.865 
11:56:26.865 ./src/app/admin/notifications/page.tsx
11:56:26.866 12:14  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.866 
11:56:26.867 ./src/app/admin/page.tsx
11:56:26.867 13:19  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.867 
11:56:26.867 ./src/app/admin/settings/page.tsx
11:56:26.867 5:10  Warning: 'supabase' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.867 80:6  Warning: React Hook useEffect has a missing dependency: 'loadSettings'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.868 121:69  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.868 223:53  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.868 
11:56:26.868 ./src/app/admin/users/page.tsx
11:56:26.868 6:32  Warning: 'NotificationTemplates' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.868 36:6  Warning: React Hook useEffect has a missing dependency: 'fetchUsers'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.869 305:66  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.869 
11:56:26.869 ./src/app/api/admin/check-status/route.ts
11:56:26.869 21:30  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.869 
11:56:26.869 ./src/app/api/admin/check-users/route.ts
11:56:26.870 5:27  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.870 
11:56:26.870 ./src/app/api/admin/stats/route.ts
11:56:26.870 5:27  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.870 
11:56:26.870 ./src/app/api/admin/user-management/route.ts
11:56:26.871 21:30  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.871 27:58  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.871 35:11  Warning: 'admin' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.871 35:18  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.871 76:19  Warning: 'statusData' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.872 125:30  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.872 167:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.872 169:45  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.872 
11:56:26.872 ./src/app/api/admin/users/route.ts
11:56:26.872 22:30  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.873 49:30  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.873 128:30  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.873 156:82  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.873 164:34  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.873 168:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.874 169:52  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.874 185:47  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.874 193:34  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.874 202:82  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.874 210:34  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.874 
11:56:26.875 ./src/app/api/auth/session/route.ts
11:56:26.875 4:27  Warning: 'request' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.875 
11:56:26.875 ./src/app/api/auth/signup/route.ts
11:56:26.875 11:11  Warning: 'requestUrl' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.875 
11:56:26.876 ./src/app/api/debug/listings/route.ts
11:56:26.876 11:39  Warning: 'sessionError' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.876 
11:56:26.876 ./src/app/api/favorites/route.ts
11:56:26.876 91:62  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.876 
11:56:26.877 ./src/app/api/listings/[id]/route.ts
11:56:26.877 97:23  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.877 
11:56:26.877 ./src/app/api/listings/route.ts
11:56:26.877 199:49  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.877 206:43  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.878 
11:56:26.878 ./src/app/api/messages/[conversationId]/route.ts
11:56:26.878 72:13  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.878 76:50  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.878 192:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.878 
11:56:26.879 ./src/app/api/messages/conversations/route.ts
11:56:26.879 39:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.879 55:50  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.879 58:69  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.879 
11:56:26.879 ./src/app/api/notifications/send-push/route.ts
11:56:26.879 37:19  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.879 
11:56:26.879 ./src/app/api/search/analytics/route.ts
11:56:26.879 54:34  Warning: 'supabase' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.879 54:44  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.879 54:49  Warning: 'since' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.879 130:38  Warning: 'supabase' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.879 130:48  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.879 130:53  Warning: 'since' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.879 163:35  Warning: 'supabase' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.879 163:45  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.879 163:50  Warning: 'since' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.879 
11:56:26.880 ./src/app/api/search/health/route.ts
11:56:26.880 11:13  Warning: 'data' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.880 37:14  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.880 
11:56:26.880 ./src/app/browse/[id]/page.tsx
11:56:26.880 201:60  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.880 201:81  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.880 267:21  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.880 334:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.880 391:64  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.880 400:52  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.880 403:40  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.880 411:61  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.880 411:109  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.880 411:157  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.880 420:36  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.880 426:57  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.880 429:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.880 433:36  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.881 440:44  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.881 445:56  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.881 451:66  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.881 451:192  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.881 461:36  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.881 465:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.881 575:26  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.881 
11:56:26.881 ./src/app/browse/page.tsx
11:56:26.881 55:12  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.881 88:44  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.881 94:45  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.881 479:34  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.881 479:60  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.881 534:49  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.881 573:83  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.881 782:27  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.881 794:27  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.882 885:33  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.882 
11:56:26.882 ./src/app/edit-listing/[id]/page.tsx
11:56:26.882 104:60  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.882 
11:56:26.882 ./src/app/favorites/page.tsx
11:56:26.882 124:26  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.882 154:27  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.882 226:35  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.882 
11:56:26.882 ./src/app/messages/page.tsx
11:56:26.882 108:74  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.882 132:27  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.882 
11:56:26.882 ./src/app/not-found.tsx
11:56:26.882 13:27  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.882 13:47  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.882 13:111  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.883 
11:56:26.883 ./src/app/notifications/page.tsx
11:56:26.883 79:11  Warning: 'alpha' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.883 142:22  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.883 
11:56:26.883 ./src/app/page.tsx
11:56:26.883 16:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.883 17:60  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.883 30:56  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.883 40:45  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.883 251:43  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.883 296:86  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.883 622:24  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.883 796:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.883 811:28  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.883 819:91  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.883 819:117  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.884 1089:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.884 1265:54  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.884 
11:56:26.884 ./src/app/privacy/page.tsx
11:56:26.884 26:25  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.884 26:29  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.884 26:31  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.884 26:36  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.884 26:41  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.884 26:44  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.884 93:86  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.884 100:166  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.884 100:179  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.885 
11:56:26.885 ./src/app/profile/[id]/page.tsx
11:56:26.885 63:49  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.885 129:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.885 246:33  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.885 
11:56:26.885 ./src/app/profile/page.tsx
11:56:26.885 280:45  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.885 556:57  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.885 722:31  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.885 
11:56:26.885 ./src/app/search-advanced/page.tsx
11:56:26.885 184:34  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.886 361:45  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.886 361:53  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.887 407:34  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.887 422:25  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.887 487:31  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.887 
11:56:26.887 ./src/app/settings/page.tsx
11:56:26.887 24:10  Warning: 'profile' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.887 47:6  Warning: React Hook useEffect has a missing dependency: 'fetchProfile'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.887 
11:56:26.887 ./src/app/terms/page.tsx
11:56:26.887 26:48  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.887 26:56  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.887 110:43  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.887 110:49  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.887 
11:56:26.887 ./src/components/FileUpload.tsx
11:56:26.888 4:44  Warning: 'UploadOptions' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.888 17:24  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.888 18:21  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.888 232:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.888 
11:56:26.888 ./src/components/PWAInstallButton.tsx
11:56:26.888 13:56  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.888 27:43  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.888 
11:56:26.888 ./src/components/PWAInstaller.tsx
11:56:26.888 6:56  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.888 
11:56:26.888 ./src/components/chat/MessagingInterface.tsx
11:56:26.894 63:111  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.895 
11:56:26.895 ./src/components/common/ErrorBoundary.tsx
11:56:26.895 44:19  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.895 
11:56:26.895 ./src/components/common/MobileListingCard.tsx
11:56:26.895 4:10  Warning: 'Heart' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.895 6:8  Warning: 'StarRating' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.895 114:9  Warning: 'handleUserClick' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.895 129:11  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.895 144:11  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.896 
11:56:26.896 ./src/components/common/ResponsiveImage.tsx
11:56:26.896 113:7  Warning: Image elements must have an alt prop, either with meaningful text, or an empty string for decorative images.  jsx-a11y/alt-text
11:56:26.896 
11:56:26.896 ./src/components/common/ReviewCard.tsx
11:56:26.896 44:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.896 
11:56:26.896 ./src/components/listings/ContactSeller.tsx
11:56:26.896 142:23  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.896 142:36  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.896 
11:56:26.897 ./src/components/listings/ImageUpload.tsx
11:56:26.897 194:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.897 
11:56:26.897 ./src/components/listings/ListingForm.tsx
11:56:26.897 48:20  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.897 111:67  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.897 
11:56:26.897 ./src/components/listings/ListingManager.tsx
11:56:26.897 31:9  Warning: 'router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.897 40:6  Warning: React Hook useEffect has a missing dependency: 'fetchListings'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.897 78:28  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.897 112:50  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.898 252:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.898 
11:56:26.898 ./src/components/premium/ComingSoonModal.tsx
11:56:26.898 80:58  Warning: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
11:56:26.898 
11:56:26.898 ./src/components/profile/UserListings.tsx
11:56:26.898 34:9  Warning: 'router' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.898 45:6  Warning: React Hook useEffect has a missing dependency: 'fetchListings'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.898 93:34  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.898 340:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.898 
11:56:26.898 ./src/components/profile/UserReviews.tsx
11:56:26.898 31:47  Warning: 'currentUserId' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.899 56:6  Warning: React Hook useEffect has a missing dependency: 'fetchReviewsAndStats'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.899 230:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.899 253:37  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.899 253:60  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.899 
11:56:26.899 ./src/components/search/AdvancedSearch.tsx
11:56:26.899 5:40  Warning: 'Clock' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.899 5:47  Warning: 'TrendingUp' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.899 474:11  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.899 552:17  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.899 636:37  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.899 636:45  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.899 773:21  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.899 
11:56:26.899 ./src/components/search/LocationFilter.tsx
11:56:26.899 4:31  Warning: 'useCallback' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.899 
11:56:26.899 ./src/components/search/SimpleAdvancedSearch.tsx
11:56:26.899 5:18  Warning: 'Filter' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.900 5:43  Warning: 'ChevronDown' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.900 133:21  Warning: '_' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.900 343:56  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.900 343:77  Warning: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
11:56:26.900 414:23  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.900 494:29  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
11:56:26.900 
11:56:26.900 ./src/hooks/useFavorites.ts
11:56:26.900 141:6  Warning: React Hook useEffect has a missing dependency: 'fetchFavorites'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.900 240:6  Warning: React Hook useEffect has a missing dependency: 'checkFavoriteStatus'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.900 
11:56:26.900 ./src/hooks/useMessages.ts
11:56:26.900 15:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.900 66:43  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.900 67:51  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.901 145:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.901 155:6  Warning: React Hook useCallback has a missing dependency: 'markAsRead'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.901 183:14  Warning: 'err' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.901 197:31  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.901 522:30  Warning: The ref value 'messageSubscriptions.current' will likely have changed by the time this effect cleanup function runs. If this ref points to a node rendered by React, copy 'messageSubscriptions.current' to a variable inside the effect, and use that variable in the cleanup function.  react-hooks/exhaustive-deps
11:56:26.901 
11:56:26.901 ./src/hooks/useRealtime.ts
11:56:26.901 256:54  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.901 276:40  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.901 298:50  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.901 318:22  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.901 331:22  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.902 
11:56:26.902 ./src/hooks/useReviews.ts
11:56:26.902 68:6  Warning: React Hook useEffect has a missing dependency: 'fetchReviews'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.902 
11:56:26.902 ./src/hooks/useSimpleMessages.ts
11:56:26.902 92:6  Warning: React Hook useEffect has a missing dependency: 'fetchConversations'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.902 212:6  Warning: React Hook useEffect has a missing dependency: 'fetchMessages'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
11:56:26.902 
11:56:26.902 ./src/hooks/useUserListings.ts
11:56:26.902 79:34  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.902 
11:56:26.902 ./src/lib/admin/auth.ts
11:56:26.903 10:31  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.903 185:28  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.903 
11:56:26.903 ./src/lib/admin/invitations.ts
11:56:26.903 17:31  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.903 40:31  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.903 218:3  Warning: 'revokedBy' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.903 
11:56:26.903 ./src/lib/admin/mfa.ts
11:56:26.903 59:13  Warning: 'error' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.903 70:13  Warning: 'error' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.903 308:11  Warning: 'iv' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.903 316:12  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.903 323:11  Warning: 'isEnabled' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.904 
11:56:26.904 ./src/lib/auth/mockAuth.ts
11:56:26.904 2:10  Warning: 'supabase' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.904 
11:56:26.904 ./src/lib/auth-error-handler.ts
11:56:26.904 12:36  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.904 16:44  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.904 25:46  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.904 33:46  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.904 82:30  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.904 
11:56:26.904 ./src/lib/browser-detection.ts
11:56:26.904 34:67  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.904 49:19  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.904 156:43  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.905 
11:56:26.905 ./src/lib/latency.ts
11:56:26.905 48:38  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.905 48:71  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.905 64:11  Warning: 'isAlgeria' is assigned a value but never used.  @typescript-eslint/no-unused-vars
11:56:26.905 109:16  Warning: 'error' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.905 246:25  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.905 361:47  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.905 366:46  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.905 396:36  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.905 409:58  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.905 
11:56:26.905 ./src/lib/notifications/push.ts
11:56:26.905 2:10  Warning: 'supabase' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.906 13:10  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.906 55:41  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.906 55:54  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.906 92:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.906 92:57  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.906 129:123  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.906 164:96  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.906 
11:56:26.906 ./src/lib/rate-limit/database.ts
11:56:26.906 5:10  Warning: 'createServerSupabaseClient' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.906 6:10  Warning: 'RateLimit' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.907 
11:56:26.907 ./src/lib/search/enhanced-utils.ts
11:56:26.907 2:10  Warning: 'createServerSupabaseClient' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.907 30:13  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.907 39:27  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.907 49:21  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.907 51:25  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.907 133:38  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.907 153:45  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.907 173:38  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.907 197:40  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.907 197:101  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.907 226:39  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.908 227:35  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.908 271:21  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.908 273:25  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.908 293:31  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.909 322:36  Warning: 'userId' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.909 
11:56:26.909 ./src/lib/search/performance-monitor.ts
11:56:26.909 4:32  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.909 49:39  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.909 82:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.909 
11:56:26.909 ./src/lib/search/utils.ts
11:56:26.909 54:50  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.909 129:46  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.909 
11:56:26.909 ./src/lib/storage.ts
11:56:26.910 2:38  Warning: 'CompressionResult' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.910 223:79  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.910 247:20  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
11:56:26.910 
11:56:26.910 ./src/lib/supabase/server.ts
11:56:26.910 73:16  Warning: 'cookiesToSet' is defined but never used.  @typescript-eslint/no-unused-vars
11:56:26.910 
11:56:26.910 info  - Need to disable some ESLint rules? Learn more here: https://nextjs.org/docs/app/api-reference/config/eslint#disabling-rules
11:56:33.527    Collecting page data ...
11:56:34.054 ✅ Supabase client instance created
11:56:34.592    Generating static pages (0/59) ...
11:56:35.353    Generating static pages (14/59) 
11:56:35.354 ✅ Supabase client instance created
11:56:35.366 ✅ Supabase client instance created
11:56:35.374    Generating static pages (29/59) 
11:56:35.467 ✅ Supabase client instance created
11:56:35.575    Generating static pages (44/59) 
11:56:35.669 🔥 ADMIN LAYOUT IS LOADING! This should appear in console!
11:56:35.670 🔥 ADMIN LAYOUT IS LOADING! This should appear in console!
11:56:35.691 🔥 ADMIN LAYOUT IS LOADING! This should appear in console!
11:56:35.691 🔥 ADMIN LAYOUT IS LOADING! This should appear in console!
11:56:35.710 🔥 ADMIN LAYOUT IS LOADING! This should appear in console!
11:56:35.779 🔥 ADMIN LAYOUT IS LOADING! This should appear in console!
11:56:35.780 🔥 ADMIN LAYOUT IS LOADING! This should appear in console!
11:56:35.780 🔥 ADMIN LAYOUT IS LOADING! This should appear in console!
11:56:35.786  ✓ Generating static pages (59/59)
11:56:36.409    Finalizing page optimization ...
11:56:36.410    Collecting build traces ...
11:57:03.076 
11:57:03.090 Route (app)                            Size  First Load JS
11:57:03.090 ┌ ○ /                                 23 kB         192 kB
11:57:03.090 ├ ○ /_not-found                         0 B         168 kB
11:57:03.090 ├ ○ /add-item                       5.64 kB         174 kB
11:57:03.090 ├ ƒ /add-item/[category]            16.4 kB         185 kB
11:57:03.090 ├ ƒ /add-item/edit/[id]               501 B         169 kB
11:57:03.090 ├ ○ /admin                           1.9 kB         175 kB
11:57:03.090 ├ ○ /admin/admins                    2.4 kB         175 kB
11:57:03.090 ├ ○ /admin/analytics                2.54 kB         175 kB
11:57:03.090 ├ ○ /admin/listings                 2.67 kB         175 kB
11:57:03.091 ├ ○ /admin/logs                     3.01 kB         176 kB
11:57:03.091 ├ ○ /admin/notifications            2.29 kB         175 kB
11:57:03.091 ├ ○ /admin/settings                 3.06 kB         176 kB
11:57:03.091 ├ ○ /admin/users                    3.74 kB         176 kB
11:57:03.091 ├ ƒ /api/admin/check-status             0 B            0 B
11:57:03.091 ├ ƒ /api/admin/check-users              0 B            0 B
11:57:03.091 ├ ƒ /api/admin/stats                    0 B            0 B
11:57:03.091 ├ ƒ /api/admin/user-management          0 B            0 B
11:57:03.091 ├ ƒ /api/admin/users                    0 B            0 B
11:57:03.091 ├ ƒ /api/auth/callback                  0 B            0 B
11:57:03.091 ├ ƒ /api/auth/reset-password            0 B            0 B
11:57:03.091 ├ ƒ /api/auth/session                   0 B            0 B
11:57:03.091 ├ ƒ /api/auth/signin                    0 B            0 B
11:57:03.091 ├ ƒ /api/auth/signout                   0 B            0 B
11:57:03.091 ├ ƒ /api/auth/signup                    0 B            0 B
11:57:03.091 ├ ƒ /api/auth/update-password           0 B            0 B
11:57:03.092 ├ ƒ /api/debug/listings                 0 B            0 B
11:57:03.092 ├ ƒ /api/exec-sql                       0 B            0 B
11:57:03.092 ├ ƒ /api/favorites                      0 B            0 B
11:57:03.092 ├ ƒ /api/favorites/[id]                 0 B            0 B
11:57:03.092 ├ ƒ /api/health                         0 B            0 B
11:57:03.092 ├ ƒ /api/listings                       0 B            0 B
11:57:03.092 ├ ƒ /api/listings/[id]                  0 B            0 B
11:57:03.092 ├ ƒ /api/listings/search                0 B            0 B
11:57:03.092 ├ ƒ /api/messages/[conversationId]      0 B            0 B
11:57:03.092 ├ ƒ /api/messages/conversations         0 B            0 B
11:57:03.092 ├ ƒ /api/monitoring                     0 B            0 B
11:57:03.092 ├ ƒ /api/notifications/send-push        0 B            0 B
11:57:03.092 ├ ƒ /api/profile                        0 B            0 B
11:57:03.092 ├ ƒ /api/reviews                        0 B            0 B
11:57:03.092 ├ ƒ /api/reviews/[id]                   0 B            0 B
11:57:03.092 ├ ƒ /api/search                         0 B            0 B
11:57:03.092 ├ ƒ /api/search/analytics               0 B            0 B
11:57:03.092 ├ ƒ /api/search/count                   0 B            0 B
11:57:03.092 ├ ƒ /api/search/health                  0 B            0 B
11:57:03.093 ├ ƒ /api/search/lean                    0 B            0 B
11:57:03.093 ├ ƒ /api/search/suggestions             0 B            0 B
11:57:03.093 ├ ƒ /api/upload                         0 B            0 B
11:57:03.093 ├ ○ /browse                         18.8 kB         188 kB
11:57:03.093 ├ ƒ /browse/[id]                    6.33 kB         176 kB
11:57:03.093 ├ ƒ /chat/[conversationId]          2.98 kB         171 kB
11:57:03.093 ├ ƒ /edit-listing/[id]              14.2 kB         183 kB
11:57:03.093 ├ ○ /favorites                      6.64 kB         175 kB
11:57:03.093 ├ ○ /forgot-password                5.12 kB         174 kB
11:57:03.093 ├ ○ /help                               0 B         172 kB
11:57:03.093 ├ ○ /messages                       4.85 kB         173 kB
11:57:03.093 ├ ○ /my-listings                    9.06 kB         177 kB
11:57:03.093 ├ ○ /notifications                  2.11 kB         170 kB
11:57:03.093 ├ ○ /privacy                            0 B         172 kB
11:57:03.094 ├ ○ /profile                        12.5 kB         182 kB
11:57:03.094 ├ ƒ /profile/[id]                   4.88 kB         173 kB
11:57:03.094 ├ ○ /reset-password                 5.32 kB         174 kB
11:57:03.094 ├ ○ /search-advanced                5.26 kB         174 kB
11:57:03.094 ├ ○ /settings                       6.31 kB         175 kB
11:57:03.094 ├ ○ /signin                         7.67 kB         177 kB
11:57:03.094 ├ ○ /signup                         10.4 kB         180 kB
11:57:03.094 └ ○ /terms                              0 B         172 kB
11:57:03.094 + First Load JS shared by all        187 kB
11:57:03.094   ├ chunks/3f4967a4ebc2a9b7.js      17.2 kB
11:57:03.094   ├ chunks/63dba52cde864d84.js      59.2 kB
11:57:03.094   ├ chunks/9c12a2333db3d1e4.js      10.1 kB
11:57:03.094   ├ chunks/9f3b581335d0f72d.js      14.1 kB
11:57:03.094   └ chunks/e2a4e794fb253bdb.js      39.2 kB
11:57:03.094   ├ chunks/378ec570ad77ba12.css     17.5 kB
11:57:03.094   └ other shared chunks (total)     29.2 kB
11:57:03.094 
11:57:03.094 
11:57:03.095 ƒ Middleware                        73.1 kB
11:57:03.095 
11:57:03.095 ○  (Static)   prerendered as static content
11:57:03.095 ƒ  (Dynamic)  server-rendered on demand
11:57:03.095 
11:57:03.443 Traced Next.js server files in: 80.931ms
11:57:03.939 Created all serverless functions in: 495.857ms
11:57:04.031 Collected static files (public/, static/, .next/static): 6.068ms
11:57:04.177 Build Completed in /vercel/output [1m]
11:57:04.377 Deploying outputs...
11:57:16.750 Deployment completed
11:57:17.574 Creating build cache...
11:57:28.884 Created build cache: 11.309s
11:57:28.885 Uploading build cache [185.62 MB]
11:57:31.721 Build cache uploaded: 2.836s