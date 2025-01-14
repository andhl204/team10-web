import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AiFillAppstore } from "react-icons/ai";
import { BiHeartSquare } from "react-icons/bi";
import { useHistory } from "react-router";
import { useAuthContext } from "../../../context/AuthContext";
import { useTrackContext } from "../../../context/TrackContext";
import LikeItem from "./LikeItem";
import styles from "./Likes.module.scss";

const Likes = () => {
  const history = useHistory();
  const goToSomewhere = (sth: string) => {
    history.push(sth);
  };
  const [filterInput, setFilterInput] = useState("");
  const [likeList, setLikeList] = useState([
    {
      artist: {
        permalink: "",
        display_name: "",
        id: -1,
        city: "",
        country: "",
        is_followed: false,
      },
      permailink: "",
      title: "",
      repost_count: 0,
      like_count: 0,
      comment_count: 0,
      count: 0,
      audio: "",
      image: "",
      id: -1,
      created_at: "",
      description: "",
      genre: null,
      tags: [],
      is_private: false,
      audio_length: 0,
    },
  ]);
  const [filteredLike, setFilteredLike] = useState([
    {
      artist: {
        permalink: "",
        display_name: "",
        id: -1,
        city: "",
        country: "",
        is_followed: false,
      },
      permailink: "",
      title: "",
      repost_count: 0,
      like_count: 0,
      comment_count: 0,
      count: 0,
      audio: "",
      image: "",
      id: -1,
      created_at: "",
      description: "",
      genre: null,
      tags: [],
      is_private: false,
      audio_length: 0,
    },
  ]);
  const [nextPage, setNextPage] = useState<string | null>(null);
  const { userSecret, setUserSecret } = useAuthContext();
  const filter = (e: any) => {
    setFilterInput(e.target.value);
    const newList = likeList.filter((item) =>
      item.title.includes(e.target.value)
    );
    setFilteredLike(newList);
  };
  const _ = require("lodash");
  useEffect(() => {
    const checkValid = async () => {
      if (userSecret.permalink === undefined) {
        const jwtToken = localStorage.getItem("jwt_token");
        const permal = localStorage.getItem("permalink");
        const ID = localStorage.getItem("id");
        await setUserSecret({
          ...userSecret,
          jwt: jwtToken,
          permalink: permal,
          id: ID,
        });
      }
    };
    checkValid();
  }, []);
  const fetchLikesList = async () => {
    await axios({
      method: "get",
      url: `/users/${userSecret.id}/likes/tracks?page_size=24`,
      headers: { Authorization: `JWT ${userSecret.jwt}` },
      data: {
        user_id: userSecret.id,
      },
    }).then((res) => {
      setLikeList(res.data.results);
      setFilteredLike(res.data.results);
      res.data.next === null
        ? null
        : setNextPage(`users${res.data.next.split("users")[1]}`);
    });
    setFilterInput("");
  };
  useEffect(() => {
    if (userSecret.permalink !== undefined) {
      const fetchUserId = async () => {
        try {
          fetchLikesList();
        } catch {
          toast.error("유저 정보 불러오기에 실패하였습니다");
        }
      };
      fetchUserId();
    }
  }, [userSecret]);
  const addLikeList = () => {
    if (nextPage !== null && likeList.length === filteredLike.length) {
      axios({
        method: "get",
        url: nextPage,
        headers: { Authorization: `JWT ${userSecret.jwt}` },
        data: {
          user_id: userSecret.id,
        },
      })
        .then((res) => {
          setLikeList([...likeList, ...res.data.results]);
          setFilteredLike([...likeList, ...res.data.results]);
          res.data.next === null
            ? setNextPage(null)
            : setNextPage(`users${res.data.next.split("users")[1]}`);
        })
        .catch(() => toast.error("like list 불러오기에 실패하였습니다"));
    }
  };
  const fetchLikeList = _.throttle(() => {
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    if (scrollTop + clientHeight >= scrollHeight) {
      // 페이지 끝에 도달하면 추가 데이터를 받아온다
      addLikeList();
    }
  }, 500);
  useEffect(() => {
    window.addEventListener("scroll", fetchLikeList);
    return () => {
      window.removeEventListener("scroll", fetchLikeList);
    };
  });
  const {
    setTrackIsPlaying,
    setPlayingTime,
    audioPlayer,
    setAudioSrc,
    setTrackBarArtist,
    setTrackBarTrack,
    trackIsPlaying,
    trackBarTrack,
    setTrackBarPlaylist,
  } = useTrackContext();
  const playMusic = () => {
    if (trackIsPlaying) {
      audioPlayer.current.play();
      setPlayingTime(audioPlayer.current.currentTime);
    } else {
      audioPlayer.current.pause();
      setPlayingTime(audioPlayer.current.currentTime);
    }
  };
  const hitTrack = async (track_id: string | number) => {
    await axios({
      method: "put",
      url: `tracks/${track_id}/hit`,
      headers: { Authorization: `JWT ${userSecret.jwt}` },
      data: {
        user_id: userSecret.id,
      },
    });
  };
  const togglePlayPause = (track: any, artist: any) => {
    // 재생/일시정지 버튼 누를 때
    if (trackBarTrack.id === track.id) {
      const prevValue = trackIsPlaying;
      setTrackIsPlaying(!prevValue);
      if (!prevValue) {
        audioPlayer.current.play();
        setPlayingTime(audioPlayer.current.currentTime);
      } else {
        audioPlayer.current.pause();
        setPlayingTime(audioPlayer.current.currentTime);
      }
    } else {
      setAudioSrc(track.audio);
      setTrackIsPlaying(true);
      setTrackBarArtist(artist);
      setTrackBarTrack(track);
      audioPlayer.current.src = track.audio;
      setTrackBarPlaylist([]);
      hitTrack(track.id);
      setTimeout(() => {
        audioPlayer.current.play();
        setPlayingTime(audioPlayer.current.currentTime);
      }, 1);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <div
            className={styles.others}
            onClick={() => goToSomewhere("/you/library")}
          >
            Overview
          </div>
          <div className={styles.focus}>Likes</div>
          <div
            className={styles.others}
            onClick={() => goToSomewhere("/you/sets")}
          >
            Playlists
          </div>
          <div
            className={styles.others}
            onClick={() => goToSomewhere("/you/albums")}
          >
            Albums
          </div>

          <div
            className={styles.others}
            onClick={() => goToSomewhere("/you/following")}
          >
            Following
          </div>
          <div
            className={styles.others}
            onClick={() => goToSomewhere("/you/history")}
          >
            History
          </div>
        </div>
        <div className={styles.recent_played}>
          <div className={styles.listHeader}>
            <div className={styles.headerText}>
              Hear the tracks you’ve liked:
            </div>
            <div className={styles.filterWrapper}>
              <div>View</div>
              <AiFillAppstore className={styles.squareIcon} />
              <input
                type="text"
                className={styles.filter}
                placeholder="Filter"
                value={filterInput}
                onChange={filter}
              />
            </div>
          </div>
          <div
            className={
              likeList.length === 0
                ? styles.noItemsWrapper
                : styles.itemsWrapper
            }
          >
            {likeList.length === 0 ? (
              <div className={styles.noLikeWrapper}>
                <BiHeartSquare className={styles.noLike} />
                <div className={styles.text}>You have no likes yet</div>
                <a href="/discover">Browse trending playlists</a>
              </div>
            ) : (
              filteredLike.map((item: any) => (
                <LikeItem
                  title={item.title}
                  img={item.image}
                  key={item.id}
                  trackId={item.id}
                  artist={item.artist.display_name}
                  artistId={item.artist.id}
                  trackPermal={item.permalink}
                  artistPermal={item.artist.permalink}
                  togglePlayPause={togglePlayPause}
                  track={item}
                  playMusic={playMusic}
                  fetchLikesList={fetchLikesList}
                  is_followed={item.artist.is_followed}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Likes;
