import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { videos } from './data/mock';
import { Shell } from './components/SignalUI';
import { HomePage } from './pages/home';
import { BriefingPage } from './pages/briefing';
import { NewsPage, StoryPage } from './pages/news';
import { VideoPage, VideosPage } from './pages/videos';
import { ChannelsPage, SavedPage, SettingsPage } from './pages/library';

const queryClient = new QueryClient();

function App() {
  const [savedStories,setSavedStories] = useState<string[]>([]);
  const [savedVideos,setSavedVideos] = useState<string[]>(['deep-time']);
  const [watched,setWatched] = useState<string[]>(videos.filter(video=>video.watched).map(video=>video.id));
  const toggleStory = (id:string) => setSavedStories(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
  const toggleVideo = (id:string) => setSavedVideos(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);
  const toggleWatched = (id:string) => setWatched(current=>current.includes(id)?current.filter(item=>item!==id):[...current,id]);

  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,'')}>
    <RoutedErrorBoundary><Shell savedCount={savedStories.length+savedVideos.length}><Switch>
      <Route path="/" component={()=><HomePage savedStories={savedStories} toggleStory={toggleStory} watched={watched} toggleWatched={toggleWatched} savedVideos={savedVideos} toggleVideo={toggleVideo}/>} />
      <Route path="/briefing" component={BriefingPage} />
      <Route path="/news" component={()=><NewsPage saved={savedStories} toggle={toggleStory}/>} />
      <Route path="/news/category/:category" component={()=><NewsPage saved={savedStories} toggle={toggleStory}/>} />
      <Route path="/news/:storyId" component={()=><StoryPage saved={savedStories} toggle={toggleStory}/>} />
      <Route path="/videos" component={()=><VideosPage saved={savedVideos} toggle={toggleVideo} watched={watched} toggleWatched={toggleWatched}/>} />
      <Route path="/videos/:videoId" component={()=><VideoPage saved={savedVideos} toggle={toggleVideo} watched={watched} toggleWatched={toggleWatched}/>} />
      <Route path="/channels" component={ChannelsPage} />
      <Route path="/saved" component={()=><SavedPage savedStories={savedStories} toggleStory={toggleStory} savedVideos={savedVideos} toggleVideo={toggleVideo} watched={watched} toggleWatched={toggleWatched}/>} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound}/>
    </Switch></Shell></RoutedErrorBoundary>
  </WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>;
}

function RoutedErrorBoundary({children}:{children:ReactNode}) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

export default App;