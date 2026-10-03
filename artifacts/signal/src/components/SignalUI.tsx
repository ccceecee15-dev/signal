import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Bookmark, BookmarkCheck, ChevronRight, CircleHelp, Compass, Home, Library, Play, Search, Settings, Video as VideoIcon, X } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import type { NewsArticle, NewsCategory } from '@workspace/api-client-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { channels, type Video } from '../data/mock';

const newsCategories = [
  { slug:'international', label:'International' },
  { slug:'india', label:'India' },
  { slug:'united-states', label:'United States' },
  { slug:'technology', label:'Technology' },
];
const artColors:Record<string,string>={plum:'#635566',ochre:'#9d7950',sage:'#6d8377',blue:'#617a8a',rust:'#9b6652',teal:'#597e7b',ink:'#5c656d',gold:'#a28755',coral:'#ad7565',moss:'#707e68',sand:'#a69076',night:'#5e6c82'};
const coverageTones:Record<'left'|'center'|'right',string>={left:'#748f82',center:'#b9a77b',right:'#aa8075'};
const categoryLabels:Record<NewsCategory,string>={international:'International',india:'India','united-states':'United States',technology:'Technology'};

export function Shell({children,savedCount}:{children:ReactNode;savedCount:number}) {
  const [location,setLocation] = useLocation();
  const [searchOpen,setSearchOpen]=useState(false);
  const isDetail = location.startsWith('/news/')||location.startsWith('/videos/');
  const navItems = [
    { href:'/', label:'Home', icon:Home },
    { href:'/news', label:'News', icon:Compass },
    { href:'/videos', label:'Videos', icon:VideoIcon },
    { href:'/channels', label:'Channels', icon:Library },
    { href:'/saved', label:'Saved', icon:Bookmark },
  ];
  const activeFor=(href:string)=>location===href || (href==='/news'&&location.startsWith('/news/')) || (href==='/videos'&&location.startsWith('/videos/'));
  return <div className="shell flex bg-background text-foreground">
    <aside className="hidden w-[236px] shrink-0 flex-col border-r border-border bg-[hsl(var(--sidebar))] px-5 py-7 md:flex">
      <Link href="/" className="mb-12 flex items-center gap-3 px-2" data-testid="link-brand"><span className="grid h-8 w-8 place-items-center rounded-[3px] bg-primary text-primary-foreground"><span className="h-[14px] w-[14px] rotate-45 border-[1.5px] border-current"/></span><span className="text-[19px] font-semibold tracking-[-.055em]">signal<span className="text-primary">.</span></span></Link>
      <nav className="space-y-1" aria-label="Main navigation">
        <Link href="/" data-testid="nav-home" className={`sidebar-link flex items-center gap-3 rounded-[3px] px-3 py-[10px] text-[13px] ${location==='/'?'bg-[hsl(var(--sidebar-accent))] font-semibold text-foreground':'text-muted-foreground hover:text-foreground'}`}><Home size={16} strokeWidth={1.7}/>Home</Link>
        <p className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Watch</p>
        {[{href:'/videos',label:'Videos',icon:VideoIcon},{href:'/channels',label:'Channels',icon:Library}].map(item=>{const Icon=item.icon;const active=activeFor(item.href);return <Link key={item.href} href={item.href} data-testid={`nav-${item.label.toLowerCase()}`} className={`sidebar-link flex items-center gap-3 rounded-[3px] px-3 py-[10px] text-[13px] ${active?'bg-[hsl(var(--sidebar-accent))] font-semibold text-foreground':'text-muted-foreground hover:text-foreground'}`}><Icon size={16} strokeWidth={active?2:1.7}/>{item.label}</Link>})}
        <p className="mb-2 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Read</p>
        <Link href="/news" data-testid="nav-news" className={`sidebar-link flex items-center gap-3 rounded-[3px] px-3 py-[10px] text-[13px] ${location.startsWith('/news')?'bg-[hsl(var(--sidebar-accent))] font-semibold text-foreground':'text-muted-foreground hover:text-foreground'}`}><Compass size={16} strokeWidth={1.7}/>News</Link>
        <div className="ml-[27px] space-y-0.5 border-l border-border pl-3">{newsCategories.map(category=>{const href=`/news/category/${category.slug}`;const active=location===href;return <Link key={category.slug} href={href} data-testid={`nav-category-${category.slug}`} className={`block rounded-[3px] px-2.5 py-2 text-[12px] ${active?'font-medium text-foreground':'text-muted-foreground hover:text-foreground'}`}>{category.label}</Link>})}</div>
        <Link href="/saved" data-testid="nav-saved" className={`sidebar-link mt-5 flex items-center gap-3 rounded-[3px] px-3 py-[10px] text-[13px] ${location==='/saved'?'bg-[hsl(var(--sidebar-accent))] font-semibold text-foreground':'text-muted-foreground hover:text-foreground'}`}><Bookmark size={16} strokeWidth={1.7}/>Saved<span className="ml-auto text-[11px] tabular-nums">{savedCount}</span></Link>
      </nav>
      <div className="mt-10 border-t border-border pt-5"><p className="px-3 text-[10px] font-semibold uppercase tracking-[.16em] text-muted-foreground">Your sources</p><div className="mt-3 space-y-3 px-3">{channels.slice(0,4).map((ch,i)=><Link key={ch.id} href="/channels" className="flex items-center gap-2.5 text-[12px] text-muted-foreground hover:text-foreground" data-testid={`sidebar-channel-${ch.id}`}><span className={`h-[7px] w-[7px] rounded-full ${['bg-[#5e877b]','bg-[#bf8c4f]','bg-[#787b8a]','bg-[#7a9c9a]'][i]}`}/>{ch.name}</Link>)}</div><Link href="/channels" className="mt-4 flex items-center px-3 text-[11px] text-primary hover:underline" data-testid="link-all-channels">Manage sources <ChevronRight size={13}/></Link></div>
      <div className="mt-auto border-t border-border pt-4"><Link href="/settings" className={`flex items-center gap-3 rounded-[3px] px-3 py-2.5 text-[13px] ${location==='/settings'?'text-foreground':'text-muted-foreground hover:text-foreground'}`} data-testid="nav-settings"><Settings size={16} strokeWidth={1.7}/>Preferences</Link><div className="mt-5 flex items-center gap-3 px-3"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#e1d5c6] text-[11px] font-semibold text-[#554b41]">AM</div><div><div className="text-[12px] font-medium">Alex Morgan</div><div className="mt-0.5 text-[10px] text-muted-foreground">Personal edition</div></div></div></div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-border bg-background/95 px-5 md:px-10">
        <div className="flex items-center gap-3 md:hidden"><Link href="/" className="flex items-center gap-2 font-semibold tracking-tight" data-testid="mobile-brand"><span className="grid h-7 w-7 place-items-center rounded-[3px] bg-primary text-primary-foreground"><span className="h-3 w-3 rotate-45 border border-current"/></span>signal<span className="text-primary">.</span></Link></div>
         <div className="hidden items-center gap-2 text-[11px] text-muted-foreground md:flex"><span className="h-1.5 w-1.5 rounded-full bg-primary"/>{isDetail?'Reading view':'A quieter way to keep up'}<span className="mx-1 text-border">/</span><span className="text-foreground/70">Public RSS news · demo videos</span></div>
        {searchOpen&&<div className="absolute inset-x-0 top-0 z-30 flex h-[60px] items-center border-b border-border bg-background px-5 md:px-10"><Search size={17} className="mr-3 text-muted-foreground"/><input autoFocus placeholder="Search your sources…" className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" data-testid="input-search"/><button onClick={()=>setSearchOpen(false)} aria-label="Close search" className="ml-3 p-2 text-muted-foreground" data-testid="button-close-search"><X size={17}/></button></div>}
        <div className="ml-auto flex items-center gap-3 sm:gap-4"><span className="hidden text-[11px] text-muted-foreground sm:inline" data-testid="text-current-date">{new Intl.DateTimeFormat('en',{weekday:'short',month:'short',day:'numeric'}).format(new Date())}</span><span className="hidden h-5 w-px bg-border sm:block"/><button onClick={()=>setSearchOpen(!searchOpen)} aria-label="Search" className="flex items-center gap-2 text-muted-foreground hover:text-foreground" data-testid="button-search"><Search size={17}/><span className="hidden text-[12px] sm:inline">Search</span><kbd className="hidden rounded-[2px] border border-border px-1.5 py-0.5 text-[10px] sm:inline">⌘ K</kbd></button><span className="hidden h-5 w-px bg-border sm:block"/><button onClick={()=>setLocation('/settings')} className="text-muted-foreground hover:text-foreground" aria-label="Help and preferences" data-testid="button-help"><CircleHelp size={17}/></button></div>
      </header>
      <main className="mx-auto w-full max-w-[1190px] flex-1 px-5 pb-24 pt-9 md:px-10 md:pb-14 md:pt-11">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-[62px] items-center justify-around border-t border-border bg-background/95 px-2 md:hidden">{navItems.map(item=>{const Icon=item.icon;const active=activeFor(item.href);return <Link key={item.href} href={item.href} className={`flex min-w-[54px] flex-col items-center gap-1 text-[9px] ${active?'text-primary':'text-muted-foreground'}`} data-testid={`mobile-nav-${item.label.toLowerCase()}`}><Icon size={18}/>{item.label}</Link>})}<Link href="/settings" className={`flex min-w-[54px] flex-col items-center gap-1 text-[9px] ${location==='/settings'?'text-primary':'text-muted-foreground'}`} data-testid="mobile-nav-preferences"><Settings size={18}/>More</Link></nav>
    </div>
  </div>;
}

export function Eyebrow({children}:{children:ReactNode}){return <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">{children}</p>}
export function PageHeading({eyebrow,title,description,action}:{eyebrow:string;title:string;description?:string;action?:ReactNode}){return <div className="mb-8 flex items-end justify-between gap-4"><div><Eyebrow>{eyebrow}</Eyebrow><h1 className="serif mt-2 text-[37px] leading-[1.08] md:text-[44px]" data-testid="heading-page">{title}</h1>{description&&<p className="mt-3 max-w-[570px] text-[13px] leading-6 text-muted-foreground">{description}</p>}</div>{action}</div>}
export function formatNewsCategory(category:NewsCategory){return categoryLabels[category]}
export function formatPublishedTime(publishedAt:string|null){
  if(!publishedAt)return 'Date unavailable';
  const date=new Date(publishedAt);
  if(Number.isNaN(date.getTime()))return 'Date unavailable';
  return formatDistanceToNowStrict(date,{addSuffix:true});
}
export function CoverageBar({article,size='compact'}:{article:NewsArticle;size?:'compact'|'large'}){
  const summary=article.coverage;
  if(!summary||summary.total===0||summary.segments.length===0)return null;
  const textSize=size==='large'?'text-[10px]':'text-[8px]';
  const barSize=size==='large'?'h-[9px]':'h-[6px]';
  const label=summary.segments.map(segment=>`${segment.perspective[0].toUpperCase()}${segment.perspective.slice(1)} ${Math.round(segment.percentage)}%`).join(' · ');
  const sourceLabel=`${summary.total} sources`;

  return <Link
    href={`/news/${article.id}`}
    className="block w-full text-left"
    aria-label={`Open ${article.title}. ${label} · ${sourceLabel}`}
    data-testid={`link-coverage-${article.id}`}
  >
    <span className="sr-only">{label} · {sourceLabel}</span>
    <span className={`flex w-full overflow-hidden rounded-[2px] ${barSize}`} data-testid={`coverage-bar-${article.id}-${size}`}>
      {summary.segments.map(segment=><Tooltip key={segment.perspective}>
        <TooltipTrigger asChild>
          <span
            role="img"
            aria-label={`${segment.perspective} — ${segment.count} sources`}
            title={`${segment.perspective} — ${segment.count} sources`}
            className="h-full shrink-0"
            style={{width:`${segment.width}%`,backgroundColor:coverageTones[segment.perspective]}}
            data-testid={`coverage-segment-${article.id}-${segment.perspective}`}
          />
        </TooltipTrigger>
        <TooltipContent side="top" className="rounded-[2px] border border-border bg-background px-2.5 py-1 text-[10px] text-foreground shadow-sm">
          {segment.perspective} — {segment.count} sources
        </TooltipContent>
      </Tooltip>)}
    </span>
    <span className={`mt-1 flex flex-wrap items-center gap-x-1 text-muted-foreground ${textSize}`} data-testid={`text-coverage-${article.id}`}>
      <span>{label}</span><span aria-hidden="true">·</span><span>{sourceLabel}</span>
    </span>
  </Link>;
}
export function NewsRow({article,saved,toggle,index}:{article:NewsArticle;saved:boolean;toggle:()=>void;index:number}){return <article className="story-row group grid grid-cols-[32px_minmax(0,1fr)_auto] gap-3 border-b border-border py-[19px] sm:grid-cols-[42px_minmax(0,1fr)_auto] md:gap-5" data-testid={`story-row-${article.id}`}><div className="serif pt-0.5 text-[20px] text-muted-foreground/50">{String(index+1).padStart(2,'0')}</div><div className="min-w-0"><div className="mb-1.5 flex flex-wrap items-center gap-2 text-[10px]"><span className="font-semibold uppercase tracking-[.1em] text-primary">{formatNewsCategory(article.category)}</span><span className="text-border">/</span><span className="font-medium text-muted-foreground">{article.source}</span><span className="text-border">/</span><time className="text-muted-foreground" dateTime={article.publishedAt??undefined}>{formatPublishedTime(article.publishedAt)}</time></div><Link href={`/news/${article.id}`} className="min-w-0" data-testid={`link-story-${article.id}`}><h3 className="serif max-w-[670px] text-[21px] leading-[1.16] group-hover:text-primary sm:text-[23px]">{article.title}</h3></Link>{article.description&&<p className="mt-2 line-clamp-2 max-w-[680px] text-[12px] leading-[1.65] text-muted-foreground">{article.description}</p>}{article.coverage&&<div className="mt-3 max-w-[350px]"><CoverageBar article={article}/></div>}</div><div className="flex items-start gap-2 pt-1"><button type="button" onClick={toggle} aria-label={saved?'Remove bookmark':'Save story'} className="p-1 text-muted-foreground hover:text-primary" data-testid={`button-save-story-${article.id}`}>{saved?<BookmarkCheck size={16}/>:<Bookmark size={16}/>}</button><Link href={`/news/${article.id}`} aria-label="Open story" className="story-arrow p-1 text-muted-foreground group-hover:text-primary" data-testid={`link-open-story-${article.id}`}><ChevronRight size={17}/></Link></div></article>}
export function NewsLoadingRows({count=4}:{count?:number}){return <div aria-label="Loading articles" data-testid="status-news-loading" className="animate-pulse">{Array.from({length:count},(_,index)=><article key={index} className="grid grid-cols-[32px_minmax(0,1fr)_auto] gap-3 border-b border-border py-[19px] sm:grid-cols-[42px_minmax(0,1fr)_auto] md:gap-5"><div className="h-6 w-7 bg-muted/70"/><div><div className="h-3 w-40 bg-muted/70"/><div className="mt-4 h-6 w-4/5 bg-muted/70"/><div className="mt-3 h-3 w-full max-w-[680px] bg-muted/70"/><div className="mt-2 h-3 w-2/3 bg-muted/70"/></div><div className="h-5 w-5 bg-muted/70"/></article>)}</div>}
export function Thumb({video,large=false}:{video:Video;large?:boolean}){return <div className={`thumb-art ${large?'aspect-video':'h-[72px] w-[112px] shrink-0'} rounded-[2px]`} style={{backgroundColor:artColors[video.thumbnailStyle]||'#738078'}} data-testid={`thumbnail-${video.id}`}><span className="thumb-shape"/><span className="thumb-mark">{video.category}</span>{large&&<span className="absolute inset-0 grid place-items-center"><span className="grid h-12 w-12 place-items-center rounded-full border border-white/65 bg-black/15 text-white"><Play size={17} fill="currentColor"/></span></span>}</div>}
export function VideoCompact({video,saved,toggleSave,watched,toggleWatched}:{video:Video;saved:boolean;toggleSave:()=>void;watched:boolean;toggleWatched:()=>void}){return <article className="flex gap-3 border-b border-border py-3 last:border-0" data-testid={`video-compact-${video.id}`}><Link href={`/videos/${video.id}`} data-testid={`link-video-${video.id}`}><Thumb video={video}/></Link><div className="min-w-0 flex-1"><Link href={`/videos/${video.id}`} className="line-clamp-2 text-[12px] font-medium leading-[1.45] hover:text-primary" data-testid={`link-video-title-${video.id}`}>{video.title}</Link><div className="mt-1.5 text-[10px] text-muted-foreground">{video.channel} · {video.duration}</div><div className="mt-2 flex items-center gap-2"><button onClick={toggleWatched} className="text-[9px] uppercase tracking-[.09em] text-muted-foreground hover:text-primary" data-testid={`button-watched-${video.id}`}>{watched?'Watched':'Mark watched'}</button><button onClick={toggleSave} aria-label={saved?'Remove saved video':'Save video'} className="ml-auto text-muted-foreground hover:text-primary" data-testid={`button-save-video-${video.id}`}>{saved?<BookmarkCheck size={14}/>:<Bookmark size={14}/>}</button></div></div></article>}
export function VideoCard({video,saved,toggle,watched,toggleWatched}:{video:Video;saved:boolean;toggle:()=>void;watched:boolean;toggleWatched:()=>void}){const initials=video.channel.split(/[\s&]+/).filter(Boolean).slice(0,2).map(part=>part[0]).join('');return <article className="min-w-0" data-testid={`video-card-${video.id}`}><div className="relative"><Link href={`/videos/${video.id}`} data-testid={`link-video-card-${video.id}`}><Thumb video={video} large/></Link><span className="absolute bottom-2 right-2 bg-[#1e2524]/85 px-1.5 py-1 text-[9px] text-white">{video.duration}</span></div><div className="mt-3 flex items-start justify-between gap-3"><div className="min-w-0"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.1em] text-primary" data-testid={`channel-identity-${video.id}`}><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-[hsl(var(--sidebar))] text-[8px] tracking-normal text-foreground">{initials}</span>{video.channel}</div><Link href={`/videos/${video.id}`} className="serif mt-2 block text-[21px] leading-[1.15] hover:text-primary" data-testid={`link-video-title-${video.id}`}>{video.title}</Link><div className="mt-2 text-[10px] text-muted-foreground">{video.category} · {video.publishedAt}</div></div><button onClick={toggle} aria-label={saved?'Remove saved video':'Save video'} className="mt-1 text-muted-foreground hover:text-primary" data-testid={`button-save-video-${video.id}`}>{saved?<BookmarkCheck size={16}/>:<Bookmark size={16}/>}</button></div><button onClick={toggleWatched} className={`mt-3 text-[10px] ${watched?'text-primary':'text-muted-foreground hover:text-primary'}`} data-testid={`button-watched-card-${video.id}`}>{watched?'Marked watched':'Mark as watched'}</button></article>}
export function EmptyState({title,text,action}:{title:string;text:string;action?:ReactNode}){return <div className="grid min-h-[185px] place-items-center border border-dashed border-border px-5 py-8 text-center" data-testid="empty-state"><div><div className="mx-auto mb-4 h-8 w-8 rounded-full border border-border"/><h3 className="serif text-[22px]">{title}</h3><p className="mt-2 text-[12px] text-muted-foreground">{text}</p>{action&&<div className="mt-4 text-[11px]">{action}</div>}</div></div>}
export function SettingsSection({title,text,children}:{title:string;text:string;children:ReactNode}){return <section className="mb-8 border-t border-border pt-5"><h2 className="serif text-[24px]">{title}</h2><p className="mt-1 text-[11px] text-muted-foreground">{text}</p><div className="mt-4">{children}</div></section>}
export function SettingLine({title,detail,control}:{title:string;detail:string;control:ReactNode}){return <div className="flex items-center justify-between gap-5 border-t border-border py-4"><div><p className="text-[12px] font-medium">{title}</p><p className="mt-1 text-[11px] text-muted-foreground">{detail}</p></div>{control}</div>}
export function Toggle({checked,onClick,testid}:{checked:boolean;onClick:()=>void;testid:string}){return <button role="switch" aria-checked={checked} onClick={onClick} className={`relative h-[22px] w-[39px] shrink-0 rounded-full border transition-colors ${checked?'border-primary bg-primary':'border-border bg-muted'}`} data-testid={testid}><span className={`toggle-dot absolute top-[3px] h-[14px] w-[14px] rounded-full ${checked?'translate-x-[19px] bg-white':'translate-x-[3px] bg-muted-foreground'}`}/></button>}