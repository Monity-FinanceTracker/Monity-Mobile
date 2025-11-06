iOS node_modules/expo-router/entry.js ▓▓░░░░░░░░░░░░░░ 16.0% ( 6/19)
/home/fabiobrug/Projects/Monity-Mobile/frontend/Monity/node_modules/@expo/cli/build/src/utils/errors.js:130
    throw error;
    ^

SyntaxError: Unexpected end of input
    at cssToReactNativeRuntime (/home/fabiobrug/Projects/Monity-Mobile/frontend/Monity/node_modules/react-native-css-interop/src/css-to-rn/index.ts:125:15)
    at /home/fabiobrug/Projects/Monity-Mobile/frontend/Monity/node_modules/react-native-css-interop/src/metro/index.ts:361:48
    at processTicksAndRejections (node:internal/process/task_queues:105:5) {
  fileName: 'style.css',
  source: '/* Removido @tailwind base - causa problemas com react-native-css-interop */\n' +
    '\n' +
    '/* O NativeWind v4 não precisa do preflight do Tailwind */\n' +
    '\n' +
    '.static {\n' +
    '  position: static\n' +
    '}\n' +
    '\n' +
    '.absolute {\n' +
    '  position: absolute\n' +
    '}\n' +
    '\n' +
    '.relative {\n' +
    '  position: relative\n' +
    '}\n' +
    '\n' +
    '.inset-y-0 {\n' +
    '  top: 0px;\n' +
    '  bottom: 0px\n' +
    '}\n' +
    '\n' +
    '.-bottom-1 {\n' +
    '  bottom: -0.25rem\n' +
    '}\n' +
    '\n' +
    '.-right-1 {\n' +
    '  right: -0.25rem\n' +
    '}\n' +
    '\n' +
    '.-top-1 {\n' +
    '  top: -0.25rem\n' +
    '}\n' +
    '\n' +
    '.bottom-0 {\n' +
    '  bottom: 0px\n' +
    '}\n' +
    '\n' +
    '.left-0 {\n' +
    '  left: 0px\n' +
    '}\n' +
    '\n' +
    '.right-0 {\n' +
    '  right: 0px\n' +
    '}\n' +
    '\n' +
    '.right-2 {\n' +
    '  right: 0.5rem\n' +
    '}\n' +
    '\n' +
    '.top-0 {\n' +
    '  top: 0px\n' +
    '}\n' +
    '\n' +
    '.top-2 {\n' +
    '  top: 0.5rem\n' +
    '}\n' +
    '\n' +
    '.top-full {\n' +
    '  top: 100%\n' +
    '}\n' +
    '\n' +
    '.z-10 {\n' +
    '  z-index: 10\n' +
    '}\n' +
    '\n' +
    '.mx-auto {\n' +
    '  margin-left: auto;\n' +
    '  margin-right: auto\n' +
    '}\n' +
    '\n' +
    '.my-3 {\n' +
    '  margin-top: 0.75rem;\n' +
    '  margin-bottom: 0.75rem\n' +
    '}\n' +
    '\n' +
    '.mb-1 {\n' +
    '  margin-bottom: 0.25rem\n' +
    '}\n' +
    '\n' +
    '.mb-2 {\n' +
    '  margin-bottom: 0.5rem\n' +
    '}\n' +
    '\n' +
    '.mb-3 {\n' +
    '  margin-bottom: 0.75rem\n' +
    '}\n' +
    '\n' +
    '.mb-4 {\n' +
    '  margin-bottom: 1rem\n' +
    '}\n' +
    '\n' +
    '.mb-5 {\n' +
    '  margin-bottom: 1.25rem\n' +
    '}\n' +
    '\n' +
    '.mb-6 {\n' +
    '  margin-bottom: 1.5rem\n' +
    '}\n' +
    '\n' +
    '.mb-8 {\n' +
    '  margin-bottom: 2rem\n' +
    '}\n' +
    '\n' +
    '.ml-2 {\n' +
    '  margin-left: 0.5rem\n' +
    '}\n' +
    '\n' +
    '.ml-4 {\n' +
    '  margin-left: 1rem\n' +
    '}\n' +
    '\n' +
    '.mr-2 {\n' +
    '  margin-right: 0.5rem\n' +
    '}\n' +
    '\n' +
    '.mr-3 {\n' +
    '  margin-right: 0.75rem\n' +
    '}\n' +
    '\n' +
    '.mr-6 {\n' +
    '  margin-right: 1.5rem\n' +
    '}\n' +
    '\n' +
    '.mt-1 {\n' +
    '  margin-top: 0.25rem\n' +
    '}\n' +
    '\n' +
    '.mt-2 {\n' +
    '  margin-top: 0.5rem\n' +
    '}\n' +
    '\n' +
    '.mt-3 {\n' +
    '  margin-top: 0.75rem\n' +
    '}\n' +
    '\n' +
    '.mt-4 {\n' +
    '  margin-top: 1rem\n' +
    '}\n' +
    '\n' +
    '.mt-6 {\n' +
    '  margin-top: 1.5rem\n' +
    '}\n' +
    '\n' +
    '.mt-8 {\n' +
    '  margin-top: 2rem\n' +
    '}\n' +
    '\n' +
    '.flex {\n' +
    '  display: flex\n' +
    '}\n' +
    '\n' +
    '.table {\n' +
    '  display: table\n' +
    '}\n' +
    '\n' +
    '.contents {\n' +
    '  display: contents\n' +
    '}\n' +
    '\n' +
    '.hidden {\n' +
    '  display: none\n' +
    '}\n' +
    '\n' +
    '.h-1 {\n' +
    '  height: 0.25rem\n' +
    '}\n' +
    '\n' +
    '.h-10 {\n' +
    '  height: 2.5rem\n' +
    '}\n' +
    '\n' +
    '.h-12 {\n' +
    '  height: 3rem\n' +
    '}\n' +
    '\n' +
    '.h-16 {\n' +
    '  height: 4rem\n' +
    '}\n' +
    '\n' +
    '.h-2 {\n' +
    '  height: 0.5rem\n' +
    '}\n' +
    '\n' +
    '.h-20 {\n' +
    '  height: 5rem\n' +
    '}\n' +
    '\n' +
    '.h-3 {\n' +
    '  height: 0.75rem\n' +
    '}\n' +
    '\n' +
    '.h-6 {\n' +
    '  height: 1.5rem\n' +
    '}\n' +
    '\n' +
    '.h-8 {\n' +
    '  height: 2rem\n' +
    '}\n' +
    '\n' +
    '.h-full {\n' +
    '  height: 100%\n' +
    '}\n' +
    '\n' +
    '.h-px {\n' +
    '  height: 1px\n' +
    '}\n' +
    '\n' +
    '.max-h-20 {\n' +
    '  max-height: 5rem\n' +
    '}\n' +
    '\n' +
    '.max-h-\\[90\\%\\] {\n' +
    '  max-height: 90%\n' +
    '}\n' +
    '\n' +
    '.w-10 {\n' +
    '  width: 2.5rem\n' +
    '}\n' +
    '\n' +
    '.w-16 {\n' +
    '  width: 4rem\n' +
    '}\n' +
    '\n' +
    '.w-20 {\n' +
    '  width: 5rem\n' +
    '}\n' +
    '\n' +
    '.w-3 {\n' +
    '  width: 0.75rem\n' +
    '}\n' +
    '\n' +
    '.w-6 {\n' +
    '  width: 1.5rem\n' +
    '}\n' +
    '\n' +
    '.w-8 {\n' +
    '  width: 2rem\n' +
    '}\n' +
    '\n' +
    '.w-\\[85\\%\\] {\n' +
    '  width: 85%\n' +
    '}\n' +
    '\n' +
    '.w-full {\n' +
    '  width: 100%\n' +
    '}\n' +
    '\n' +
    '.min-w-0 {\n' +
    '  min-width: 0px\n' +
    '}\n' +
    '\n' +
    '.max-w-\\[80\\%\\] {\n' +
    '  max-width: 80%\n' +
    '}\n' +
    '\n' +
    '.max-w-sm {\n' +
    '  max-width: 24rem\n' +
    '}\n' +
    '\n' +
    '.flex-1 {\n' +
    '  flex: 1 1 0%\n' +
    '}\n' +
    '\n' +
    '.flex-shrink-0 {\n' +
    '  flex-shrink: 0\n' +
    '}\n' +
    '\n' +
    '.border-collapse {\n' +
    '  border-collapse: collapse\n' +
    '}\n' +
    '\n' +
    '.transform {\n' +
    '  -webkit-transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));\n' +
    '          transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))\n' +
    '}\n' +
    '\n' +
    '@-webkit-keyframes spin {\n' +
    '  to {\n' +
    '    -webkit-transform: rotate(360deg);\n' +
    '            transform: rotate(360deg)\n' +
    '  }\n' +
    '}\n' +
    '\n' +
    '@keyframes spin {\n' +
    '  to {\n' +
    '    -webkit-transform: rotate(360deg);\n' +
    '            transform: rotate(360deg)\n' +
    '  }\n' +
    '}\n' +
    '\n' +
    '.animate-spin {\n' +
    '  -webkit-animation: spin 1s linear infinite;\n' +
    '          animation: spin 1s linear infinite\n' +
    '}\n' +
    '\n' +
    '.flex-row {\n' +
    '  flex-direction: row\n' +
    '}\n' +
    '\n' +
    '.flex-wrap {\n' +
    '  flex-wrap: wrap\n' +
    '}\n' +
    '\n' +
    '.items-start {\n' +
    '  align-items: flex-start\n' +
    '}\n' +
    '\n' +
    '.items-end {\n' +
    '  align-items: flex-end\n' +
    '}\n' +
    '\n' +
    '.items-center {\n' +
    '  align-items: center\n' +
    '}\n' +
    '\n' +
    '.justify-start {\n' +
    '  justify-content: flex-start\n' +
    '}\n' +
    '\n' +
    '.justify-end {\n' +
    '  justify-content: flex-end\n' +
    '}\n' +
    '\n' +
    '.justify-center {\n' +
    '  justify-content: center\n' +
    '}\n' +
    '\n' +
    '.justify-between {\n' +
    '  justify-content: space-between\n' +
    '}\n' +
    '\n' +
    '.gap-1 {\n' +
    '  gap: 0.25rem\n' +
    '}\n' +
    '\n' +
    '.gap-2 {\n' +
    '  gap: 0.5rem\n' +
    '}\n' +
    '\n' +
    '.gap-3 {\n' +
    '  gap: 0.75rem\n' +
    '}\n' +
    '\n' +
    '.gap-4 {\n' +
    '  gap: 1rem\n' +
    '}\n' +
    '\n' +
    '.gap-6 {\n' +
    '  gap: 1.5rem\n' +
    '}\n' +
    '\n' +
    '.space-y-1 > :not([hidden]) ~ :not([hidden]) {\n' +
    '  --tw-space-y-reverse: 0;\n' +
    '  margin-top: calc(0.25rem * calc(1 - var(--tw-space-y-reverse)));\n' +
    '  margin-bottom: calc(0.25rem * var(--tw-space-y-reverse))\n' +
    '}\n' +
    '\n' +
    '.space-y-3 > :not([hidden]) ~ :not([hidden]) {\n' +
    '  --tw-space-y-reverse: 0;\n' +
    '  margin-top: calc(0.75rem * calc(1 - var(--tw-space-y-reverse)));\n' +
    '  margin-bottom: calc(0.75rem * var(--tw-space-y-reverse))\n' +
    '}\n' +
    '\n' +
    '.space-y-5 > :not([hidden]) ~ :not([hidden]) {\n' +
    '  --tw-space-y-reverse: 0;\n' +
    '  margin-top: calc(1.25rem * calc(1 - var(--tw-space-y-reverse)));\n' +
    '  margin-bottom: calc(1.25rem * var(--tw-space-y-reverse))\n' +
    '}\n' +
    '\n' +
    '.overflow-hidden {\n' +
    '  overflow: hidden\n' +
    '}\n' +
    '\n' +
    '.rounded {\n' +
    '  border-radius: 0.25rem\n' +
    '}\n' +
    '\n' +
    '.rounded-2xl {\n' +
    '  border-radius: 1rem\n' +
    '}\n' +
    '\n' +
    '.rounded-3xl {\n' +
    '  border-radius: 1.5rem\n' +
    '}\n' +
    '\n' +
    '.rounded-full {\n' +
    '  border-radius: 9999px\n' +
    '}\n' +
    '\n' +
    '.rounded-lg {\n' +
    '  border-radius: 0.5rem\n' +
    '}\n' +
    '\n' +
    '.rounded-md {\n' +
    '  border-radius: 0.375rem\n' +
    '}\n' +
    '\n' +
    '.rounded-xl {\n' +
    '  border-radius: 0.75rem\n' +
    '}\n' +
    '\n' +
    '.rounded-t-3xl {\n' +
    '  border-top-left-radius: 1.5rem;\n' +
    '  border-top-right-radius: 1.5rem\n' +
    '}\n' +
    '\n' +
    '.rounded-bl-md {\n' +
    '  border-bottom-left-radius: 0.375rem\n' +
    '}\n' +
    '\n' +
    '.rounded-br-md {\n' +
    '  border-bottom-right-radius: 0.375rem\n' +
    '}\n' +
    '\n' +
    '.border {\n' +
    '  border-width: 1px\n' +
    '}\n' +
    '\n' +
    '.border-0 {\n' +
    '  border-width: 0px\n' +
    '}\n' +
    '\n' +
    '.border-2 {\n' +
    '  border-width: 2px\n' +
    '}\n' +
    '\n' +
    '.border-\\[\\#FFD700\\]\\/30 {\n' +
    '  border-color: rgb(255 215 0 / 0.3)\n' +
    '}\n' +
    '\n' +
    '.border-accent {\n' +
    '  border-color: #01C38D\n' +
    '}\n' +
    '\n' +
    '.border-border-default {\n' +
    '  border-color: #262626\n' +
    '}\n' +
    '\n' +
    '.border-error {\n' +
    '  border-color: #EF4444\n' +
    '}\n' +
    '\n' +
    '.border-error\\/30 {\n' +
    '  border-color: rgb(239 68 68 / 0.3)\n' +
    '}\n' +
    '\n' +
    '.border-red-400 {\n' +
    '  border-color: #f87171\n' +
    '}\n' +
    '\n' +
    '.border-red-500 {\n' +
    '  border-color: #ef4444\n' +
    '}\n' +
    '\n' +
    '.border-red-500\\/30 {\n' +
    '  border-color: rgb(239 68 68 / 0.3)\n' +
    '}\n' +
    '\n' +
    '.border-white\\/20 {\n' +
    '  border-color: rgb(255 255 255 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-\\[\\#191E29\\] {\n' +
    '  background-color: #191E29\n' +
    '}\n' +
    '\n' +
    '.bg-\\[\\#4B5563\\] {\n' +
    '  background-color: #4B5563\n' +
    '}\n' +
    '\n' +
    '.bg-accent {\n' +
    '  background-color: #01C38D\n' +
    '}\n' +
    '\n' +
    '.bg-accent\\/10 {\n' +
    '  background-color: rgb(1 195 141 / 0.1)\n' +
    '}\n' +
    '\n' +
    '.bg-accent\\/20 {\n' +
    '  background-color: rgb(1 195 141 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-background {\n' +
    '  background-color: #0A0A0A\n' +
    '}\n' +
    '\n' +
    '.bg-black\\/50 {\n' +
    '  background-color: rgb(0 0 0 / 0.5)\n' +
    '}\n' +
    '\n' +
    '.bg-blue-500 {\n' +
    '  background-color: #3b82f6\n' +
    '}\n' +
    '\n' +
    '.bg-blue-500\\/10 {\n' +
    '  background-color: rgb(59 130 246 / 0.1)\n' +
    '}\n' +
    '\n' +
    '.bg-blue-500\\/20 {\n' +
    '  background-color: rgb(59 130 246 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-blue-600 {\n' +
    '  background-color: #2563eb\n' +
    '}\n' +
    '\n' +
    '.bg-blue-600\\/20 {\n' +
    '  background-color: rgb(37 99 235 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-border-default {\n' +
    '  background-color: #262626\n' +
    '}\n' +
    '\n' +
    '.bg-card-bg {\n' +
    '  background-color: #171717\n' +
    '}\n' +
    '\n' +
    '.bg-card-bg\\/80 {\n' +
    '  background-color: rgb(23 23 23 / 0.8)\n' +
    '}\n' +
    '\n' +
    '.bg-cyan-500 {\n' +
    '  background-color: #06b6d4\n' +
    '}\n' +
    '\n' +
    '.bg-cyan-500\\/20 {\n' +
    '  background-color: rgb(6 182 212 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-emerald-500 {\n' +
    '  background-color: #10b981\n' +
    '}\n' +
    '\n' +
    '.bg-emerald-500\\/20 {\n' +
    '  background-color: rgb(16 185 129 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-error-light {\n' +
    '  background-color: rgba(239, 68, 68, 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-gray-400 {\n' +
    '  background-color: #9ca3af\n' +
    '}\n' +
    '\n' +
    '.bg-gray-500 {\n' +
    '  background-color: #6b7280\n' +
    '}\n' +
    '\n' +
    '.bg-gray-500\\/20 {\n' +
    '  background-color: rgb(107 114 128 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-gray-600 {\n' +
    '  background-color: #4b5563\n' +
    '}\n' +
    '\n' +
    '.bg-green-500 {\n' +
    '  background-color: #22c55e\n' +
    '}\n' +
    '\n' +
    '.bg-green-500\\/10 {\n' +
    '  background-color: rgb(34 197 94 / 0.1)\n' +
    '}\n' +
    '\n' +
    '.bg-green-500\\/20 {\n' +
    '  background-color: rgb(34 197 94 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-green-600 {\n' +
    '  background-color: #16a34a\n' +
    '}\n' +
    '\n' +
    '.bg-green-600\\/20 {\n' +
    '  background-color: rgb(22 163 74 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-indigo-500 {\n' +
    '  background-color: #6366f1\n' +
    '}\n' +
    '\n' +
    '.bg-indigo-500\\/20 {\n' +
    '  background-color: rgb(99 102 241 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-orange-500 {\n' +
    '  background-color: #f97316\n' +
    '}\n' +
    '\n' +
    '.bg-orange-500\\/20 {\n' +
    '  background-color: rgb(249 115 22 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-pink-500 {\n' +
    '  background-color: #ec4899\n' +
    '}\n' +
    '\n' +
    '.bg-pink-500\\/20 {\n' +
    '  background-color: rgb(236 72 153 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-primary-bg {\n' +
    '  background-color: #191E29\n' +
    '}\n' +
    '\n' +
    '.bg-purple-500 {\n' +
    '  background-color: #a855f7\n' +
    '}\n' +
    '\n' +
    '.bg-purple-500\\/20 {\n' +
    '  background-color: rgb(168 85 247 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-red-500 {\n' +
    '  background-color: #ef4444\n' +
    '}\n' +
    '\n' +
    '.bg-red-500\\/10 {\n' +
    '  background-color: rgb(239 68 68 / 0.1)\n' +
    '}\n' +
    '\n' +
    '.bg-red-500\\/20 {\n' +
    '  background-color: rgb(239 68 68 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-transparent {\n' +
    '  background-color: transparent\n' +
    '}\n' +
    '\n' +
    '.bg-violet-500 {\n' +
    '  background-color: #8b5cf6\n' +
    '}\n' +
    '\n' +
    '.bg-violet-500\\/20 {\n' +
    '  background-color: rgb(139 92 246 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-white\\/10 {\n' +
    '  background-color: rgb(255 255 255 / 0.1)\n' +
    '}\n' +
    '\n' +
    '.bg-yellow-500 {\n' +
    '  background-color: #eab308\n' +
    '}\n' +
    '\n' +
    '.bg-yellow-500\\/20 {\n' +
    '  background-color: rgb(234 179 8 / 0.2)\n' +
    '}\n' +
    '\n' +
    '.bg-gradient-to-r {\n' +
    '  background-image: linear-gradient(to right, var(--tw-gradient-stops))\n' +
    '}\n' +
    '\n' +
    '.from-\\[\\#01C38D\\] {\n' +
    '  --tw-gradient-from: #01C38D var(--tw-gradient-from-position);\n' +
    '  --tw-gradient-to: rgb(1 195 141 / 0) var(--tw-gradient-to-position);\n' +
    '  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)\n' +
    '}\n' +
    '\n' +
    '.from-\\[\\#01C38D\\]\\/10 {\n' +
    '  --tw-gradient-from: rgb(1 195 141 / 0.1) var(--tw-gradient-from-position);\n' +
    '  --tw-gradient-to: rgb(1 195 141 / 0) var(--tw-gradient-to-position);\n' +
    '  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)\n' +
    '}\n' +
    '\n' +
    '.from-\\[\\#FFD700\\]\\/20 {\n' +
    '  --tw-gradient-from: rgb(255 215 0 / 0.2) var(--tw-gradient-from-position);\n' +
    '  --tw-gradient-to: rgb(255 215 0 / 0) var(--tw-gradient-to-position);\n' +
    '  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to)\n' +
    '}\n' +
    '\n' +
    '.to-\\[\\#01C38D\\]\\/5 {\n' +
    '  --tw-gradient-to: rgb(1 195 141 / 0.05) var(--tw-gradient-to-position)\n' +
    '}\n' +
    '\n' +
    '.to-\\[\\#01C38D\\]\\/80 {\n' +
    '  --tw-gradient-to: rgb(1 195 141 / 0.8) var(--tw-gradient-to-position)\n' +
    '}\n' +
    '\n' +
    '.to-\\[\\#FFD700\\]\\/10 {\n' +
    '  --tw-gradient-to: rgb(255 215 0 / 0.1) var(--tw-gradient-to-position)\n' +
    '}\n' +
    '\n' +
    '.p-1 {\n' +
    '  padding: 0.25rem\n' +
    '}\n' +
    '\n' +
    '.p-2 {\n' +
    '  padding: 0.5rem\n' +
    '}\n' +
    '\n' +
    '.p-3 {\n' +
    '  padding: 0.75rem\n' +
    '}\n' +
    '\n' +
    '.p-4 {\n' +
    '  padding: 1rem\n' +
    '}\n' +
    '\n' +
    '.p-6 {\n' +
    '  padding: 1.5rem\n' +
    '}\n' +
    '\n' +
    '.px-2 {\n' +
    '  padding-left: 0.5rem;\n' +
    '  padding-right: 0.5rem\n' +
    '}\n' +
    '\n' +
    '.px-3 {\n' +
    '  padding-left: 0.75rem;\n' +
    '  padding-right: 0.75rem\n' +
    '}\n' +
    '\n' +
    '.px-4 {\n' +
    '  padding-left: 1rem;\n' +
    '  padding-right: 1rem\n' +
    '}\n' +
    '\n' +
    '.px-6 {\n' +
    '  padding-left: 1.5rem;\n' +
    '  padding-right: 1.5rem\n' +
    '}\n' +
    '\n' +
    '.py-1 {\n' +
    '  padding-top: 0.25rem;\n' +
    '  padding-bottom: 0.25rem\n' +
    '}\n' +
    '\n' +
    '.py-1\\.5 {\n' +
    '  padding-top: 0.375rem;\n' +
    '  padding-bottom: 0.375rem\n' +
    '}\n' +
    '\n' +
    '.py-12 {\n' +
    '  padding-top: 3rem;\n' +
    '  padding-bottom: 3rem\n' +
    '}\n' +
    '\n' +
    '.py-2 {\n' +
    '  padding-top: 0.5rem;\n' +
    '  padding-bottom: 0.5rem\n' +
    '}\n' +
    '\n' +
    '.py-3 {\n' +
    '  padding-top: 0.75rem;\n' +
    '  padding-bottom: 0.75rem\n' +
    '}\n' +
    '\n' +
    '.py-3\\.5 {\n' +
    '  padding-top: 0.875rem;\n' +
    '  padding-bottom: 0.875rem\n' +
    '}\n' +
    '\n' +
    '.py-4 {\n' +
    '  padding-top: 1rem;\n' +
    '  padding-bottom: 1rem\n' +
    '}\n' +
    '\n' +
    '.py-8 {\n' +
    '  padding-top: 2rem;\n' +
    '  padding-bottom: 2rem\n' +
    '}\n' +
    '\n' +
    '.pb-4 {\n' +
    '  padding-bottom: 1rem\n' +
    '}\n' +
    '\n' +
    '.pb-6 {\n' +
    '  padding-bottom: 1.5rem\n' +
    '}\n' +
    '\n' +
    '.pl-4 {\n' +
    '  padding-left: 1rem\n' +
    '}\n' +
    '\n' +
    '.pr-4 {\n' +
    '  padding-right: 1rem\n' +
    '}\n' +
    '\n' +
    '.pr-6 {\n' +
    '  padding-right: 1.5rem\n' +
    '}\n' +
    '\n' +
    '.pt-2 {\n' +
    '  padding-top: 0.5rem\n' +
    '}\n' +
    '\n'... 6701 more characters,
  loc: { line: 1021, column: 1 },
  data: { type: 'EndOfInput' }
}

Node.js v22.21.0
