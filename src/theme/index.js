import { createTheme } from '@mui/material/styles'
export const SPIRIT='#C07830',MUSIC='#7C4DAB',HEALTH='#2D7A4F',CAREER='#1A5FB0',FINANCE='#1A7A6E',READING='#A0522D',FAMILY='#B5446E'
export const pillars={spirit:SPIRIT,music:MUSIC,health:HEALTH,career:CAREER,finance:FINANCE,reading:READING,family:FAMILY}
const typography={
  fontFamily:'"Plus Jakarta Sans","Inter",sans-serif',
  h1:{fontFamily:'"Fraunces","Lora",serif',fontWeight:300,letterSpacing:'-0.5px'},
  h2:{fontFamily:'"Fraunces","Lora",serif',fontWeight:300,letterSpacing:'-0.5px'},
  h3:{fontFamily:'"Fraunces","Lora",serif',fontWeight:400},
  h4:{fontFamily:'"Fraunces","Lora",serif',fontWeight:400},
  h5:{fontFamily:'"Fraunces","Lora",serif',fontWeight:400},
  h6:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontWeight:600},
  subtitle1:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontWeight:500},
  subtitle2:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontWeight:500},
  body1:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontWeight:400,fontSize:'0.9rem'},
  body2:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontWeight:400,fontSize:'0.825rem'},
  button:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontWeight:500,textTransform:'none',letterSpacing:0.2},
  caption:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:'0.75rem'},
  overline:{fontFamily:'"Plus Jakarta Sans",sans-serif',letterSpacing:2,fontWeight:600,fontSize:'0.68rem'},
}
const base={
  MuiButton:{styleOverrides:{root:{borderRadius:10,padding:'8px 20px',fontSize:13,fontWeight:500},contained:{boxShadow:'none','&:hover':{boxShadow:'none'}}}},
  MuiCard:{styleOverrides:{root:{borderRadius:16,boxShadow:'none'}}},
  MuiPaper:{styleOverrides:{root:{backgroundImage:'none'}}},
  MuiTextField:{defaultProps:{variant:'outlined',size:'small'}},
  MuiOutlinedInput:{styleOverrides:{root:{borderRadius:10}}},
  MuiChip:{styleOverrides:{root:{borderRadius:8,fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:11,fontWeight:600}}},
  MuiListItemButton:{styleOverrides:{root:{borderRadius:10,margin:'1px 8px',width:'auto'}}},
  MuiTab:{styleOverrides:{root:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontWeight:500,textTransform:'none',fontSize:13}}},
  MuiLinearProgress:{styleOverrides:{root:{borderRadius:4,height:5}}},
  MuiAlert:{styleOverrides:{root:{borderRadius:12}}},
  MuiDialog:{styleOverrides:{paper:{borderRadius:20}}},
  MuiBottomNavigationAction:{styleOverrides:{root:{fontFamily:'"Plus Jakarta Sans",sans-serif',fontSize:10}}},
}
export const darkTheme=createTheme({
  palette:{
    mode:'dark',
    primary:{main:SPIRIT,light:'#D4956A',dark:'#8A5418',contrastText:'#fff'},
    secondary:{main:MUSIC,light:'#9B71C4',dark:'#4E2878',contrastText:'#fff'},
    background: {
  default: '#0D0C0A',
  paper:   '#1C1A17',   // was probably #1A1916 — tiny lift
},
    divider:'rgba(255,255,255,0.08)',
    text: {
  primary:   '#F0EDE8',   // was probably #E0DDD8 or similar — bump it up
  secondary: '#B0AA9E',   // was probably #7A7874 — bump it up  
  disabled:  '#5C5A54',
},
    success:{main:HEALTH},info:{main:CAREER},warning:{main:SPIRIT},error:{main:'#CF4E4E'},
  },
  typography,
  components:{
    ...base,
    MuiCard:{styleOverrides:{root:{borderRadius:16,boxShadow:'none',border:'1px solid rgba(255,255,255,0.07)',backgroundColor:'#1A1916'}}},
    MuiListItemButton:{styleOverrides:{root:{borderRadius:10,margin:'1px 8px',width:'auto','&.Mui-selected':{backgroundColor:'rgba(192,120,48,0.15)','&:hover':{backgroundColor:'rgba(192,120,48,0.2)'}}}}},
    MuiOutlinedInput:{styleOverrides:{root:{borderRadius:10,'& .MuiOutlinedInput-notchedOutline':{borderColor:'rgba(255,255,255,0.12)'},'&:hover .MuiOutlinedInput-notchedOutline':{borderColor:'rgba(255,255,255,0.25)'}}}},
  },
  shape:{borderRadius:12},
})
export const lightTheme=createTheme({
  palette:{
    mode:'light',
    primary:{main:SPIRIT,light:'#D4956A',dark:'#8A5418',contrastText:'#fff'},
    secondary:{main:MUSIC,light:'#9B71C4',dark:'#4E2878',contrastText:'#fff'},
    background:{default:'#FAF9F6',paper:'#FCFBF9'},
    divider:'#D1D0CF',
    text:{primary:'#2C2C2C',secondary:'#5F5F5F',disabled:'#9E9E9E'},
    success:{main:HEALTH},info:{main:CAREER},warning:{main:SPIRIT},error:{main:'#C53030'},
  },
  typography,
  components:{
    ...base,
    MuiCard:{styleOverrides:{root:{borderRadius:16,boxShadow:'none',border:'1px solid #D1D0CF',backgroundColor:'#FCFBF9'}}},
    MuiPaper:{styleOverrides:{root:{backgroundImage:'none',border:'none'}}},
    MuiListItemButton:{styleOverrides:{root:{borderRadius:10,margin:'1px 8px',width:'auto','&.Mui-selected':{backgroundColor:'rgba(192,120,48,0.08)',borderLeft:`3px solid ${SPIRIT}`,'&:hover':{backgroundColor:'rgba(192,120,48,0.13)'}}}}},
    MuiOutlinedInput:{styleOverrides:{root:{borderRadius:10,backgroundColor:'#FCFBF9','& .MuiOutlinedInput-notchedOutline':{borderColor:'#D1D0CF'},'&:hover .MuiOutlinedInput-notchedOutline':{borderColor:'#A0A09E'},'&.Mui-focused .MuiOutlinedInput-notchedOutline':{borderColor:SPIRIT,borderWidth:'1.5px'}}}},
    MuiButton:{styleOverrides:{root:{borderRadius:10,padding:'8px 20px',fontSize:13,fontWeight:500},contained:{boxShadow:'none','&:hover':{boxShadow:'none'}},outlined:{borderWidth:'1px',borderColor:'#D1D0CF'}}},
    MuiDivider:{styleOverrides:{root:{borderColor:'#D1D0CF'}}},
  },
  shape:{borderRadius:12},
})
