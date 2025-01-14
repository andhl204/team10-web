import React, { useRef } from "react";
import { BiPencil } from "react-icons/bi";
import { MdPlaylistAdd } from "react-icons/md";
import { AiFillCaretLeft, AiFillCaretRight } from "react-icons/ai";
import { AiOutlineDown } from "react-icons/ai";
import { BsSoundwave } from "react-icons/bs";
import { BsFillFileLock2Fill } from "react-icons/bs";
import { FaPlay } from "react-icons/fa";
import { FcComments } from "react-icons/fc";
import { BsSuitHeartFill, BsTrashFill } from "react-icons/bs";
import { BiRepost } from "react-icons/bi";
import { IoMdPlay, IoMdPause } from "react-icons/io";
import styles from "./YourTracks.module.scss";
import { useHistory } from "react-router-dom";
import { useEffect, useState } from "react";
import UploadHeader from "../UploadHeader/UploadHeader";
import { useAuthContext } from "../../../context/AuthContext";
import axios from "axios";
import ReactTooltip from "react-tooltip";
import { ITag, ITrack } from "../../ArtistPage/Track/TrackPage";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTrackContext } from "../../../context/TrackContext";
import EditModal from "./EditModal";
import ArtworkModal from "./ArtworkModal";
import { confirmAlert } from "react-confirm-alert";
import "react-confirm-alert/src/react-confirm-alert.css";
import PrivacyModal from "./PrivacyModal";
import toast from "react-hot-toast";
import PlaylistModal from "./PlaylistModal";
dayjs.extend(relativeTime);

export interface IYourTracks {
  id: number;
  title: string;
  permalink: string;
  audio: string;
  image: string;
  like_count: number;
  repost_count: number;
  comment_count: number;
  genre: string | null;
  play_count: number;
  is_private: boolean;
  tags: ITag[];
}

const YourTracks = () => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [yourTracks, setYourTracks] = useState<IYourTracks[]>([]);
  const [checkedId, setCheckedId] = useState<number[]>([]);
  const [username, setUsername] = useState("");
  const [modal, setModal] = useState(false);
  const [editTrack, setEditTrack] = useState<ITrack>();
  const [loading, setLoading] = useState(true);
  const [trackCount, setTrackCount] = useState<number | null>(null);
  const [isFinalPage, setIsFinalPage] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageRendered, setPageRendered] = useState(1);
  const [currentTracks, setCurrentTracks] = useState<IYourTracks[]>([]);
  const [artworkModal, setArtworkModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [playlistModal, setPlaylistModal] = useState(false);
  const nextPage = useRef(1);
  const finalPage = useRef(0);
  const { userSecret } = useAuthContext();

  const fetchNextTracks = async () => {
    // if (pageRendered > currentPage && trackCount) {
    //   const nextPage = currentPage + 1;
    //   const nextTracks = yourTracks.slice(
    //     (nextPage - 1) * 10,
    //     trackCount >= (currentPage - 1) * 10 + 11
    //       ? (nextPage - 1) * 10 + 10
    //       : trackCount
    //   );
    //   setCurrentTracks(nextTracks);
    //   setCurrentPage(nextPage);
    // } else {
    setLoading(true);
    const tracksConfig: any = {
      method: "get",
      url: `/users/${userSecret.id}/tracks?page=${
        nextPage.current
      }&page_size=${10}`,
      headers: {
        Authorization: `JWT ${userSecret.jwt}`,
      },
      data: {},
    };
    try {
      const { data } = await axios(tracksConfig);
      setYourTracks(yourTracks.concat(data.results));
      setCurrentTracks(data.results);
      setCurrentPage(currentPage + 1);
      setPageRendered(pageRendered + 1);
      setLoading(false);
      if (data.next) {
        // 다음 페이지가 있다면 nextPage에 다음 코멘트 페이지 저장
        nextPage.current += 1;
      } else {
        // 다음 페이지가 없다면 현재 nextPage 값 === 현재 받아온 코멘트 페이지 를 마지막 페이지로 저장
        finalPage.current = nextPage.current;
        setIsFinalPage(true);
      }
    } catch (error) {
      console.log(error);
      toast.error("트랙 정보를 받아오는 데 실패했습니다");
    }
    // }
  };
  const getPreviousTracks = () => {
    const previousPage = currentPage - 1;
    setCurrentTracks(
      yourTracks.slice((previousPage - 1) * 10, (previousPage - 1) * 10 + 10)
    );
    setCurrentPage(previousPage);
  };
  const fetchYourTracksAgain = async () => {
    if (userSecret.jwt) {
      const config: any = {
        method: "get",
        url: `/users/me`,
        headers: {
          Authorization: `JWT ${userSecret.jwt}`,
        },
        data: {},
      };
      try {
        const response = await axios(config);
        setUsername(response.data.display_name);
        const tracksConfig: any = {
          method: "get",
          url: `/users/${userSecret.id}/tracks?page=${currentPage}`,
          headers: {
            Authorization: `JWT ${userSecret.jwt}`,
          },
          data: {},
        };
        try {
          const { data } = await axios(tracksConfig);
          setTrackCount(data.count);
          setCurrentTracks(data.results);
          setLoading(false);
          //   console.log(data);
          if (data.next) {
            // 다음 페이지가 있다면 nextPage에 다음 페이지 저장
            nextPage.current += 1;
          } else {
            // 다음 페이지가 없다면 현재 nextPage 값 === 현재 받아온 페이지 를 마지막 페이지로 저장
            finalPage.current = currentPage;
            setIsFinalPage(true);
          }
        } catch (error) {
          console.log(error);
        }
      } catch (error) {
        console.log(error);
        toast.error("트랙 정보를 받아오는 데 실패했습니다");
      }
    }
  };
  const fetchYourTracks = async () => {
    setCurrentPage(1);
    setIsFinalPage(false);
    nextPage.current = 1;
    finalPage.current = 0;
    if (userSecret.jwt) {
      const config: any = {
        method: "get",
        url: `/users/me`,
        headers: {
          Authorization: `JWT ${userSecret.jwt}`,
        },
        data: {},
      };
      try {
        const response = await axios(config);
        setUsername(response.data.display_name);
        const tracksConfig: any = {
          method: "get",
          url: `/users/${userSecret.id}/tracks?page=${1}`,
          headers: {
            Authorization: `JWT ${userSecret.jwt}`,
          },
          data: {},
        };
        try {
          const { data } = await axios(tracksConfig);
          setTrackCount(data.count);
          setYourTracks(data.results);
          setCurrentTracks(data.results);
          setLoading(false);
          //   console.log(data);
          if (data.next) {
            // 다음 페이지가 있다면 nextPage에 다음 페이지 저장
            nextPage.current += 1;
          } else {
            // 다음 페이지가 없다면 현재 nextPage 값 === 현재 받아온 페이지 를 마지막 페이지로 저장
            finalPage.current = nextPage.current;
            setIsFinalPage(true);
          }
        } catch (error) {
          console.log(error);
        }
      } catch (error) {
        console.log(error);
      }
    }
  };
  useEffect(() => {
    fetchYourTracks();
  }, [userSecret.jwt]);

  const editToggle = () => setIsEditOpen(!isEditOpen);

  const history = useHistory();
  const uploadTrack = () => history.push(`/upload`);

  const checkedItemHandler = (id: number, isChecked: boolean) => {
    if (isChecked) {
      setCheckedId(checkedId.concat(id));
    } else if (!isChecked && checkedId.includes(id)) {
      setCheckedId(checkedId.filter((element) => element !== id));
    }
  };

  const openArtworkModal = () => setArtworkModal(true);
  const closeArtworkModal = () => setArtworkModal(false);
  const openPrivacyModal = () => setPrivacyModal(true);
  const closePrivacyModal = () => setPrivacyModal(false);
  const openPlaylistModal = () => setPlaylistModal(true);
  const closePlaylistModal = () => setPlaylistModal(false);

  const checkedItems = checkedId
    .map((id) => currentTracks.find((track) => track.id === id))
    .filter((item) => item !== undefined);

  const clickAll = () => {
    if (checkedId.length < currentTracks.length) {
      setCheckedId(currentTracks.map((track) => track.id));
      setIsAllChecked(true);
    } else {
      setCheckedId([]);
      setIsAllChecked(false);
    }
  };

  return (
    <div className={styles.yourTracksPage}>
      {modal && editTrack && (
        <EditModal
          setModal={setModal}
          track={editTrack}
          fetchYourTracks={fetchYourTracksAgain}
        />
      )}
      <ArtworkModal
        modal={artworkModal}
        closeModal={closeArtworkModal}
        track={
          currentTracks.find((track) => track.id === checkedId[0]) ||
          currentTracks[0]
        }
        fetchYourTracks={fetchYourTracksAgain}
        checkedItems={checkedId}
      />
      <PrivacyModal
        modal={privacyModal}
        closeModal={closePrivacyModal}
        fetchYourTracks={fetchYourTracksAgain}
        checkedItems={checkedItems}
        editToggle={editToggle}
      />
      <PlaylistModal
        modal={playlistModal}
        checkedId={checkedId}
        closeModal={closePlaylistModal}
      />
      <div className={styles.wrapper}>
        <div className={styles.main}>
          <div className={styles.uploadHeader}>
            <UploadHeader />
          </div>
          <div className={styles.header}>
            <div className={styles.title}>
              <span>Your tracks</span>
            </div>
            <div className={styles.editButtons}>
              <div className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={currentTracks.length === checkedId.length}
                  onClick={clickAll}
                />
              </div>
              <div className={styles.dropdownContainer}>
                <button
                  className={styles.editTracks}
                  onClick={editToggle}
                  disabled={checkedId.length === 0}
                >
                  <BiPencil />
                  <span>Edit tracks</span>
                  <AiOutlineDown />
                </button>
                {isEditOpen && (
                  <div>
                    <ul>
                      <li
                        className={styles.privacyTags}
                        onClick={openPrivacyModal}
                      >
                        Privacy and tags
                      </li>
                      <li onClick={openArtworkModal} className={styles.artwork}>
                        Artwork
                      </li>
                    </ul>
                  </div>
                )}
              </div>
              <button
                className={styles.addToPlaylist}
                onClick={openPlaylistModal}
                disabled={checkedId.length === 0}
              >
                <MdPlaylistAdd />
                <span>&nbsp;&nbsp;Add to playlist</span>
              </button>
              <div className={styles.pageSelector}>
                <div className={styles.pageInfo}>
                  {(currentPage - 1) * 10 + 1} -{" "}
                  {trackCount && trackCount >= (currentPage - 1) * 10 + 11
                    ? (currentPage - 1) * 10 + 10
                    : trackCount}{" "}
                  of {trackCount} tracks
                </div>
                <div className={styles.pageButtons}>
                  <button
                    className={styles.backButton}
                    disabled={currentPage === 1}
                    onClick={getPreviousTracks}
                  >
                    <AiFillCaretLeft />
                  </button>
                  <button
                    className={styles.nextButton}
                    disabled={isFinalPage && nextPage.current === currentPage}
                    onClick={fetchNextTracks}
                  >
                    <AiFillCaretRight />
                  </button>
                </div>
              </div>
            </div>
          </div>
          {!loading && yourTracks.length !== 0 && (
            <ul className={styles.trackContainer}>
              {currentTracks.map((track) => {
                return (
                  <Track
                    key={track.id}
                    track={track}
                    checkedItemHandler={checkedItemHandler}
                    username={username}
                    setModal={setModal}
                    setEditTrack={setEditTrack}
                    fetchYourTracks={fetchYourTracks}
                    checkedItems={checkedId}
                    isAllChecked={isAllChecked}
                    // setIsAllChecked={setIsAllChecked}
                    // yourTracks={currentTracks}
                    // finalPage={finalPage.current}
                    // currentPage={currentPage}
                  />
                );
              })}
            </ul>
          )}
          {!loading && yourTracks.length === 0 && (
            <div className={styles.uploadTrack}>
              <div className={styles.waveContainer}>
                <BsSoundwave />
              </div>
              <div className={styles.seemQuiet}>
                Seems a little quiet over here
              </div>
              <div className={styles.uploadLink} onClick={uploadTrack}>
                Upload a track to share with your followers.
              </div>
            </div>
          )}
        </div>
      </div>{" "}
    </div>
  );
};

const Track = ({
  track,
  checkedItemHandler,
  username,
  setModal,
  setEditTrack,
  checkedItems,
  fetchYourTracks,
  isAllChecked,
}: //   setIsAllChecked,
//
//
//   yourTracks,
//   finalPage,
//   currentPage,
{
  track: IYourTracks;
  checkedItemHandler: (id: number, isChecked: boolean) => void;
  username: string;
  setModal: React.Dispatch<React.SetStateAction<boolean>>;
  setEditTrack: React.Dispatch<React.SetStateAction<ITrack | undefined>>;
  fetchYourTracks: () => void;
  checkedItems: any;
  isAllChecked: boolean;
  //   setIsAllChecked: React.Dispatch<React.SetStateAction<boolean>>;
  //   yourTracks: IYourTracks[];
  //   finalPage: number;
  //   currentPage: number;
}) => {
  const [checked, setChecked] = useState(false);
  //   const [fetchedTrack, setFetchedTrack] = useState<ITrack>();
  //   const [fetchLoading, setFetchLoading] = useState(true)
  //   const [duration, setDuration] = useState(0);
  const [play, setPlay] = useState(false);
  const player = useRef<HTMLAudioElement>(null);
  const { userSecret } = useAuthContext();
  const {
    audioSrc,
    setAudioSrc,
    trackIsPlaying,
    setTrackIsPlaying,
    setTrackBarTrack,
    audioPlayer,
    setPlayingTime,
    setTrackBarArtist,
    setTrackBarPlaylist,
    setTrackBarPlaylistId,
  } = useTrackContext();
  const history = useHistory();

  useEffect(() => {
    setChecked(isAllChecked);
  }, [isAllChecked]);

  const checkHandler = () => {
    const prevValue = checked;
    setChecked(!checked);
    checkedItemHandler(track.id, !prevValue);
    // console.log(checkedItems);
  };

  //   useEffect(() => {
  //     const fetchTrack = async () => {
  //       if (userSecret.jwt && currentPage > finalPage) {
  //         const config: any = {
  //           method: "get",
  //           url: `/tracks/${track.id}`,
  //           headers: {
  //             Authorization: `JWT ${userSecret.jwt}`,
  //           },
  //           data: {},
  //         };
  //         try {
  //           const { data } = await axios(config);
  //           const tagList = data.tags.map((value: ITag) => value.name);
  //           setFetchedTrack({
  //             id: data.id,
  //             title: data.title,
  //             permalink: data.permalink,
  //             audio: data.audio,
  //             comment_count: data.comment_count,
  //             count: data.count,
  //             created_at: data.created_at,
  //             description: data.description,
  //             genre: data.genre,
  //             image: data.image,
  //             like_count: data.like_count,
  //             repost_count: data.repost_count,
  //             tags: tagList,
  //             is_private: data.is_private,
  //             audio_length: 0,
  //           });
  //         } catch (error) {
  //           console.log(error);
  //         }
  //       }
  //     };
  //     fetchTrack();
  //   }, [userSecret, yourTracks]);
  const headerTrackSrc = track.audio.split("?")[0];
  const barTrackSrc = audioSrc.split("?")[0];

  useEffect(() => {
    if (headerTrackSrc === barTrackSrc && trackIsPlaying) {
      setPlay(true);
    } else {
      setPlay(false);
    }
  }, [audioSrc, trackIsPlaying, audioPlayer.current.src]);

  //   const calculateTime = (secs: number) => {
  //     // 트랙 길이를 분:초 단위로 환산
  //     const minutes = Math.floor(secs / 60);
  //     const seconds = Math.floor(secs % 60);
  //     const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
  //     return `${minutes}:${returnedSeconds}`;
  //   };

  //   const onLoadedMetadata = () => {
  //     if (player.current) {
  //       setDuration(player.current.duration);
  //     }
  //   };

  const togglePlayButton = () => {
    if (track && userSecret.permalink) {
      setTrackBarPlaylist([]);
      setTrackBarPlaylistId(undefined);

      if (!play) {
        if (
          headerTrackSrc !== barTrackSrc &&
          typeof userSecret.id === "number"
        ) {
          setPlayingTime(0);
          audioPlayer.current.src = track.audio;
          setAudioSrc(track.audio);
          audioPlayer.current.load();
          setTrackBarArtist({
            display_name: username,
            id: userSecret.id,
            permalink: userSecret.permalink,
          });
          setTrackBarTrack(track);
        }
        setPlay(true);
        setTrackIsPlaying(true);
        setTimeout(() => {
          audioPlayer.current.play();
        }, 1);
      } else {
        audioPlayer.current.pause();
        setPlay(false);
        setTrackIsPlaying(false);
      }
    }
  };

  //   const releasedDate = dayjs(fetchedTrack?.created_at).fromNow();
  const clickTitle = () =>
    history.push(`/${userSecret.permalink}/${track.permalink}`);

  const onEditTrack: React.MouseEventHandler = async (event) => {
    event.stopPropagation();
    if (track) {
      setModal(true);
      const config: any = {
        method: "get",
        url: `/tracks/${track.id}`,
        headers: {
          Authorization: `JWT ${userSecret.jwt}`,
        },
        data: {},
      };
      try {
        const { data } = await axios(config);
        const tagList = data.tags.map((value: ITag) => value.name);
        setEditTrack({
          id: data.id,
          title: data.title,
          permalink: data.permalink,
          audio: data.audio,
          comment_count: data.comment_count,
          play_count: data.play_count,
          created_at: data.created_at,
          description: data.description,
          genre: data.genre,
          image: data.image,
          like_count: data.like_count,
          repost_count: data.repost_count,
          tags: tagList,
          is_private: data.is_private,
          // audio_length: 0,
          is_liked: data.is_liked,
          is_reposted: data.is_reposted,
          is_followed: data.is_followed,
        });
      } catch (error) {
        console.log(error);
        toast.error("트랙 정보를 받아오는 데 실패했습니다");
      }
    }
  };
  const deleteTrack = async (event: React.MouseEvent, id: number) => {
    event.stopPropagation();
    confirmAlert({
      message: "Do you really want to delete this track?",
      buttons: [
        {
          label: "Cancel",
          onClick: () => {
            return null;
          },
        },
        {
          label: "Yes",
          onClick: async () => {
            const config: any = {
              method: "delete",
              url: `/tracks/${id}`,
              headers: {
                Authorization: `JWT ${userSecret.jwt}`,
              },
              data: {},
            };
            try {
              const response = await axios(config);
              if (response) {
                fetchYourTracks();
              }
            } catch (error) {
              console.log(error);
              toast.error("트랙을 제거하는데 실패했습니다");
            }
          },
        },
      ],
    });
    return;
  };
  const onClickName = () => history.push(`/${userSecret.permalink}`);
  const onImageError: React.ReactEventHandler<HTMLImageElement> = ({
    currentTarget,
  }) => {
    currentTarget.onerror = null;
    currentTarget.src = "/default_track_image.svg";
  };

  return (
    <li key={track.id} onClick={checkHandler}>
      <audio
        ref={player}
        src={track?.audio}
        preload="metadata"
        // onLoadedMetadata={onLoadedMetadata}
      />
      <input
        type="checkbox"
        className={styles.trackCheckBox}
        checked={
          checked || !!checkedItems.find((item: number) => item === track.id)
        }
        onChange={checkHandler}
      />
      <div
        className={styles.playContainer}
        onClick={(event) => event.stopPropagation()}
      >
        <img
          className={styles.trackImage}
          src={track.image || "/default_track_image.svg"}
          onError={onImageError}
        />
        <div className={styles.playButton} onClick={togglePlayButton}>
          {play ? <IoMdPause /> : <IoMdPlay />}
        </div>
      </div>
      <div className={styles.contentContainer}>
        <div className={styles.content}>
          <div className={styles.username}>
            <span onClick={onClickName}>{username}</span>
          </div>
          <div className={styles.title}>
            <span onClick={clickTitle}>{track.title}</span>
          </div>
        </div>
        <ul className={styles.stats}>
          {track.comment_count !== 0 && (
            <li>
              <FcComments />
              <span>{track.comment_count}</span>
            </li>
          )}
          {track.play_count !== 0 && (
            <li>
              <FaPlay />
              <span>{track.play_count}</span>
            </li>
          )}
          {track.like_count !== 0 && (
            <li>
              <BsSuitHeartFill />
              <span>{track.like_count}</span>
            </li>
          )}
          {track.repost_count !== 0 && (
            <li>
              <BiRepost />
              <span>{track.repost_count}</span>
            </li>
          )}
        </ul>
        <div className={styles.additional}>
          <div className={styles.actions}>
            <div className={styles.smallButtons}>
              <button onClick={onEditTrack}>
                <BiPencil />
              </button>
              <button onClick={(event) => deleteTrack(event, track.id)}>
                <BsTrashFill />
              </button>
            </div>
          </div>
          <div className={styles.extra}>
            {track?.is_private && (
              <div className={styles.private}>
                <span data-tip="This track is private.">
                  <BsFillFileLock2Fill />
                </span>
                <ReactTooltip effect="solid" />
              </div>
            )}
          </div>
          {/* <div className={styles.duration}>
            <span>{duration !== 0 && calculateTime(duration)}</span>
          </div>
          <div className={styles.uploadTime}>{releasedDate}</div> */}
        </div>
      </div>
    </li>
  );
};

export default YourTracks;
