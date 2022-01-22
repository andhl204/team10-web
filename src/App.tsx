import Login from "./components/Login/Login";
import TrackPage from "./components/ArtistPage/Track/TrackPage";
import Header from "./components/Header/Header";
import Discover from "./components/Discover/Discover";
import ArtistPage from "./components/ArtistPage/ArtistPage";
import Logout from "./components/Logout/Logout";
import { Switch, Route, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Library from "./components/Library/Library";
import styles from "./App.module.scss";
import Likes from "./components/Library/Likes/Likes";
import Playlists from "./components/Library/Playlists/Playlists";
import Albums from "./components/Library/Albums/Albums";
import Following from "./components/Library/Following/Following";
import { AuthProvider } from "./context/AuthContext";
import Upload from "./components/Upload/Upload";
import YourTracks from "./components/Upload/YourTracks/YourTracks";
import TrackBar from "./components/ArtistPage/Track/TrackBar/TrackBar";
import AudioTag from "./components/ArtistPage/Track/Audio/AudioTag";
import axios from "axios";
import SetPage from "./components/ArtistPage/Set/SetPage";

function App() {
  const location = useLocation();
  axios.defaults.baseURL = "https://api.soundwaffle.com"; // axios defaults 설정

  return (
    <AuthProvider>
      <div className={styles.wrapper}>
        <Toaster />
        {location.pathname !== "/" ? <Header /> : null}
        <Switch>
          <Route exact path="/" component={Login} />
          <Route exact path="/discover" component={Discover} />
          <Route exact path="/logout" component={Logout} />
          <Route exact path="/you/library" component={Library} />
          <Route exact path="/you/likes" component={Likes} />
          <Route exact path="/you/sets" component={Playlists} />
          <Route exact path="/you/albums" component={Albums} />
          <Route exact path="/you/following" component={Following} />
          <Route exact path="/upload" component={Upload} />
          <Route exact path="/you/tracks" component={YourTracks} />
          <Route exact path="/:permalink" component={ArtistPage} />
          <Route exact path="/:username/:trackname" component={TrackPage} />
          <Route exact path="/:username/sets/:playlist" component={SetPage} />
        </Switch>
        {location.pathname !== "/" && <TrackBar />}
        {location.pathname !== "/" && <AudioTag />}
      </div>
    </AuthProvider>
  );
}

export default App;
