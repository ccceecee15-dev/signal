export type VideoCategory = 'Philosophy' | 'Economics' | 'Technology' | 'Design' | 'World affairs' | 'Science';
export type Video = { id: string; category: VideoCategory; channel: string; title: string; publishedAt: string; duration: string; thumbnailStyle: string; watched: boolean };
export type Channel = { id: string; name: string; category: string; description: string };

export const videos: Video[] = [
  { id:'attention',category:'Philosophy',channel:'The Long View',title:'What attention asks of us',publishedAt:'Today',duration:'18:42',thumbnailStyle:'plum',watched:false },
  { id:'inflation',category:'Economics',channel:'Margin Notes',title:'The hidden architecture of a price',publishedAt:'Today',duration:'24:16',thumbnailStyle:'ochre',watched:false },
  { id:'interfaces',category:'Design',channel:'Form & Function',title:'Interfaces that know when to be quiet',publishedAt:'Yesterday',duration:'12:08',thumbnailStyle:'sage',watched:true },
  { id:'compute-cost',category:'Technology',channel:'Open Circuit',title:'The real cost of a clever machine',publishedAt:'Yesterday',duration:'31:05',thumbnailStyle:'blue',watched:false },
  { id:'city-memory',category:'World affairs',channel:'Field Record',title:'How cities remember what they remove',publishedAt:'2 days ago',duration:'16:39',thumbnailStyle:'rust',watched:false },
  { id:'deep-time',category:'Science',channel:'Small Wonders',title:'A field guide to deep time',publishedAt:'2 days ago',duration:'21:51',thumbnailStyle:'teal',watched:false },
  { id:'good-life',category:'Philosophy',channel:'The Long View',title:'Can a good life be measured?',publishedAt:'3 days ago',duration:'27:14',thumbnailStyle:'ink',watched:true },
  { id:'money-time',category:'Economics',channel:'Margin Notes',title:'Money, time and the things we count',publishedAt:'3 days ago',duration:'19:33',thumbnailStyle:'gold',watched:false },
  { id:'objects',category:'Design',channel:'Form & Function',title:'The overlooked life of ordinary objects',publishedAt:'4 days ago',duration:'14:52',thumbnailStyle:'coral',watched:false },
  { id:'internet',category:'Technology',channel:'Open Circuit',title:'A more local internet is possible',publishedAt:'5 days ago',duration:'33:27',thumbnailStyle:'moss',watched:false },
  { id:'borders',category:'World affairs',channel:'Field Record',title:'A border is also a story we tell',publishedAt:'6 days ago',duration:'22:09',thumbnailStyle:'sand',watched:true },
  { id:'night-sky',category:'Science',channel:'Small Wonders',title:'What we learn by looking up slowly',publishedAt:'1 week ago',duration:'17:46',thumbnailStyle:'night',watched:false },
];

export const channels: Channel[] = [
  {id:'long-view',name:'The Long View',category:'Philosophy',description:'Ideas about attention, meaning and the examined life.'},
  {id:'margin-notes',name:'Margin Notes',category:'Economics',description:'A clear-eyed look at the systems behind everyday choices.'},
  {id:'form-function',name:'Form & Function',category:'Design',description:'The people, objects and decisions that shape what we use.'},
  {id:'open-circuit',name:'Open Circuit',category:'Technology',description:'Technology considered in its human and social context.'},
  {id:'field-record',name:'Field Record',category:'World affairs',description:'Ground-level stories about place, borders and belonging.'},
  {id:'small-wonders',name:'Small Wonders',category:'Science',description:'Big questions, carefully observed.'},
  {id:'civic-fieldnotes',name:'Civic Fieldnotes',category:'Reporting',description:'Notes from the spaces where policy meets daily life.'},
  {id:'the-meridian',name:'The Meridian',category:'International',description:'A considered international perspective.'},
];