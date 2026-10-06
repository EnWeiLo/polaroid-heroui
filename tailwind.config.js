import {heroui} from '@heroui/react'
const primary={DEFAULT:'#0A84FF',foreground:'#fff'}
export default {
  content:['./index.html','./src/**/*.{js,jsx}','./node_modules/@heroui/**/theme/dist/**/*.{js,mjs}'],
  darkMode:'class',
  plugins:[heroui({themes:{light:{colors:{primary}},dark:{colors:{primary}}}})]
}
