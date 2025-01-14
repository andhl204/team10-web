import React, { useEffect, useRef, useState } from "react";
// import axios from "axios";
// import toast from "react-hot-toast";
import styles from "./SetEditModal.module.scss";
import axios from "axios";
import { GrClose } from "react-icons/gr";
import toast from "react-hot-toast";
import { useAuthContext } from "../../../../context/AuthContext";
import { IPlaylist, ISetTrack } from "../SetPage";
import { GiCancel } from "react-icons/gi";
import { confirmAlert } from "react-confirm-alert";
import { useHistory } from "react-router";

interface ITrackPermalink {
  permalink: string;
  id: number;
}

const SetEditModal = ({
  setModal,
  playlist,
  fetchSet,
}: {
  setModal: React.Dispatch<React.SetStateAction<boolean>>;
  playlist: IPlaylist;
  fetchSet: () => void;
}) => {
  const [imageUrl, setImageUrl] = useState<any>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [tPermalink, setTPermalink] = useState<string>("");
  //   const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [permalinkList, setPermalinkList] = useState<ITrackPermalink[]>([]);
  const [genre, setGenre] = useState<string | null | undefined>(null);
  const [customGenre, setCustomGenre] = useState<any>();

  const BASIC = "basic info";
  const TRACKS = "tracks";
  const [tab, setTab] = useState(BASIC);
  const clickTracks = () => setTab(TRACKS);
  const clickBasicInfo = () => setTab(BASIC);

  const imageRef = useRef<HTMLInputElement>(null);
  const { userSecret } = useAuthContext();
  const history = useHistory();

  useEffect(() => {
    setTitle(playlist.title);
    setTPermalink(playlist.permalink);
    setDescription(playlist.description);
    setIsPrivate(playlist.is_private);
    // setTags(track.tags);
    setImageUrl(playlist.image);
    setTagInput(playlist.tags.map((tag) => tag.name).join(", "));
    if (playlist.genre?.name !== "None" && playlist.genre !== null) {
      setGenre("custom");
      setCustomGenre(playlist.genre?.name);
    } else {
      setGenre(playlist.genre?.name);
    }
  }, [playlist]);

  const openFileSelector = (event: any) => {
    event.preventDefault();
    if (imageRef.current) {
      imageRef.current.click();
    }
  };

  const handleImageInput: React.ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    if (event.target.files) {
      const reader = new FileReader();
      reader.readAsDataURL(event.target.files[0]);
      reader.onload = () => {
        setImageUrl(reader.result);
      };
      setImageFile(event.target.files[0]);
    }
  };

  const changeGenre = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setGenre(event.target.value);
  };

  const changeTrackPermalink = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTPermalink(event.target.value);
    if (event.target.value.length === 0) {
      toast.error("링크를 작성해주세요");
    }
    if (
      permalinkList &&
      permalinkList.find(
        (link: ITrackPermalink) =>
          link.permalink === tPermalink && link.id !== playlist.id
      )
    ) {
      toast.error(
        `동일한 링크의 다른 플레이리스트가 존재합니다(${tPermalink})`
      );
    }
  };

  useEffect(() => {
    const getPermalinks = async () => {
      if (userSecret.jwt) {
        const config: any = {
          method: "get",
          url: `/users/${userSecret.id}/tracks`,
          headers: {
            Authorization: `JWT ${userSecret.jwt}`,
          },
          data: {},
        };
        try {
          const { data } = await axios(config);
          const results = data.results;
          setPermalinkList(results);
        } catch (error) {
          console.log(error);
        }
      }
    };
    getPermalinks();
  }, [userSecret.jwt]);

  const changeTitle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
    if (event.target.value.length === 0) {
      toast.error("제목을 작성해주세요");
    }
  };

  const changeTags = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(event.target.value);
  };

  const onSaveChanges = async () => {
    if (!/^[0-9a-zA-Z_-]+$/g.test(tPermalink)) {
      return toast.error(
        `링크에는 숫자, 알파벳 소문자와 대문자, -, _ 만 사용해 주세요.`
      );
    }
    let config: any;
    if (imageFile) {
      config = {
        method: "patch",
        url: `/sets/${playlist.id}`,
        headers: {
          Authorization: `JWT ${userSecret.jwt}`,
        },
        data: {
          title: title,
          permalink: tPermalink,
          description: description,
          is_private: isPrivate,
          image_extension: imageFile.name.split(".").at(-1),
          ...(tagInput
            ? {
                tags_input: tagInput.replace(/,/g, "").split(" "),
              }
            : { tags_input: [] }),
          genre_input: genre === "custom" ? customGenre : null,
        },
      };
      try {
        const { data } = await axios(config);
        if (data) {
          fetchSet();
          setModal(false);
          try {
            await axios.put(data.image_presigned_url, imageFile, {
              headers: {
                "Content-Type": imageFile.type,
              },
            });
          } catch (error) {
            console.log(error);
          }
        }
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response &&
          error.response.status === 400
        ) {
          toast.error("잘못된 요청입니다. 제목과 링크를 확인해주세요.");
        } else {
          toast.error("플레이리스트를 업데이트할 수 없습니다");
        }
        console.log(error);
      }
    } else {
      config = {
        method: "patch",
        url: `/sets/${playlist.id}`,
        headers: {
          Authorization: `JWT ${userSecret.jwt}`,
        },
        data: {
          title: title,
          permalink: tPermalink,
          description: description,
          is_private: isPrivate,
          ...(tagInput
            ? {
                tags_input: tagInput.replace(/,/g, "").split(" "),
              }
            : { tags_input: [] }),
          genre_input: genre === "custom" ? customGenre : null,
        },
      };
      try {
        const response = await axios(config);
        if (response) {
          fetchSet();
          setModal(false);
          toast.success("플레이리스트를 업데이트했습니다");
        }
      } catch (error) {
        if (
          axios.isAxiosError(error) &&
          error.response &&
          error.response.status === 400
        ) {
          toast.error("잘못된 요청입니다. 제목과 링크를 확인해주세요.");
        } else {
          toast.error("플레이리스트를 업데이트할 수 없습니다");
        }
        console.log(error);
      }
    }
    // try {
    //   const response = await axios(config);
    //   if (response) {
    //     fetchYourTracks();
    //     setModal(false);
    //   }
    // } catch (error) {
    //   if (
    //     axios.isAxiosError(error) &&
    //     error.response &&
    //     error.response.status === 400
    //   ) {
    //     toast.error("잘못된 요청입니다. 제목과 링크를 확인해주세요.");
    //   }
    //   console.log(error);
    // }
  };

  const closeModal = () => setModal(false);
  const removeTrack = async (track: ISetTrack) => {
    confirmAlert({
      message: "Do you really want to remove this track?",
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
              url: `/sets/${playlist.id}/tracks`,
              headers: {
                Authorization: `JWT ${userSecret.jwt}`,
              },
              data: { track_ids: { id: track.id } },
            };
            try {
              await axios(config);
              toast.success("플레이리스트에서 트랙을 삭제했습니다");
              history.push(
                `/${userSecret.permalink}/sets/${playlist.permalink}`
              );
            } catch (error) {
              console.log(error);
              toast.error("플레이리스트에서 트랙을 삭제하는 데 실패했습니다");
            }
          },
        },
      ],
    });
  };
  const onImageError: React.ReactEventHandler<HTMLImageElement> = ({
    currentTarget,
  }) => {
    currentTarget.onerror = null;
    currentTarget.src = "/default_track_image.svg";
  };

  return (
    <div className={styles.modalWrapper} onClick={closeModal}>
      <div className={styles.closeButton} onClick={closeModal}>
        <GrClose />
      </div>
      <div
        className={styles["upload-modal"]}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles["upload-modal-header"]}>
          <div
            className={tab === BASIC ? styles["upload-basic-info"] : undefined}
            onClick={clickBasicInfo}
          >
            Basic info
          </div>
          <div
            className={tab === TRACKS ? styles["upload-basic-info"] : undefined}
            onClick={clickTracks}
          >
            Tracks
          </div>
        </div>
        <div className={styles["upload-modal-body"]}>
          {tab === TRACKS && (
            <ul className={styles.trackContainer}>
              {playlist.tracks?.map((track) => {
                return (
                  <li key={track.id}>
                    <div className={styles.imageContainer}>
                      <img
                        src={track.image || "/default_track_image.svg"}
                        onError={onImageError}
                      />
                    </div>
                    <div className={styles.content}>
                      <span className={styles.artistName}>
                        {track.artist_display_name} -
                      </span>
                      &nbsp;
                      <span className={styles.trackTitle}>{track.title}</span>
                    </div>
                    <div className={styles.deleteButton}>
                      <GiCancel onClick={() => removeTrack(track)} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {tab === BASIC && (
            <>
              <div className={styles["upload-image"]}>
                {!imageUrl && (
                  <img
                    className={styles["upload-track-img"]}
                    src="https://upload.wikimedia.org/wikipedia/commons/d/d7/Sky.jpg"
                    alt="track-img"
                  />
                )}
                {imageUrl && (
                  <img
                    className={styles["upload-track-img"]}
                    src={
                      imageUrl || playlist.image || "/default.track_image.svg"
                    }
                    alt={`${playlist.title}의 이미지`}
                  />
                )}
                <button onClick={openFileSelector}>
                  <img src="https://a-v2.sndcdn.com/assets/images/camera-2d93bb05.svg" />
                  <div>Upload image</div>
                </button>
                <input type="file" onChange={handleImageInput} ref={imageRef} />
              </div>
              <div className={styles["upload-info"]}>
                <div className={styles["upload-info-title"]}>
                  <label>Title</label>
                  <input value={title} onChange={changeTitle} />
                  <div className={styles["upload-info-permalink"]}>
                    <div>{`soundcloud.com/${userSecret.permalink}/`}</div>
                    <input value={tPermalink} onChange={changeTrackPermalink} />
                  </div>
                </div>
                <div className={styles["uplaod-info-genre-custom"]}>
                  <div className={styles["upload-info-genre"]}>
                    <label>Genre</label>
                    <select
                      onChange={(event) => changeGenre(event)}
                      value={genre || "None"}
                    >
                      <option value="None">None</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  {genre === "custom" && (
                    <div className={styles["upload-info-genre"]}>
                      <text>Custom Genre</text>
                      <input
                        onChange={(e) => setCustomGenre(e.target.value)}
                        value={customGenre}
                      />
                    </div>
                  )}
                </div>
                <div className={styles["upload-info-tag"]}>
                  <label>Additional tags</label>
                  <input
                    value={tagInput}
                    placeholder={
                      "Add tags to describe the genre and mood of your track"
                    }
                    onChange={changeTags}
                  />
                </div>
                <div className={styles["upload-info-description"]}>
                  <label>Description</label>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                  />
                </div>
                <div className={styles["upload-info-privacy"]}>
                  <text>Privacy:</text>
                  <div className={styles["form-check"]}>
                    <input
                      className={styles["form-check-input"]}
                      type="radio"
                      name="flexRadioDefault"
                      id="flexRadioDefault2"
                      checked={!isPrivate}
                      onChange={() => setIsPrivate(false)}
                    />
                    <label className={styles["form-check-label"]}>
                      &nbsp;Public
                    </label>
                  </div>
                  <div className={styles["form-check"]}>
                    <input
                      className={styles["form-check-input"]}
                      type="radio"
                      name="flexRadioDefault"
                      id="flexRadioDefault1"
                      checked={isPrivate}
                      onChange={() => setIsPrivate(true)}
                    />
                    <label className={styles["form-check-label"]}>
                      &nbsp;Private
                    </label>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className={styles["upload-modal-button"]}>
          <button
            className={styles["cancel-button"]}
            onClick={() => setModal(false)}
          >
            Cancel
          </button>
          {tab === BASIC && (
            <button className={styles["save-button"]} onClick={onSaveChanges}>
              Save
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SetEditModal;
