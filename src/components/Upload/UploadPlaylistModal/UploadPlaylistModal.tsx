import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../../../context/AuthContext";
import "./UploadPlaylistModal.scss";
// import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import PlaylistTrack from "./PlaylistTrack/PlaylistTrack";

function UploadPlaylistModal({ selectedFiles, setPlaylistModal }: any) {
  const { userSecret } = useAuthContext();
  const [error, setError] = useState<boolean>(false);

  const permalink = userSecret.permalink;
  const trackNum = Array.from({ length: selectedFiles.length }, (_, i) => i);

  const [imageUrl, setImageUrl] = useState<any>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [title, setTitle] = useState<string>("");
  const [playlistType, setPlaylistType] = useState<string>("playlist");
  const [description, setDescription] = useState<string>("");
  const [isPrivate, setIsPrivate] = useState<boolean>(false);
  const [listPermalink, setListPermalink] = useState<string>("");
  const [genre, setGenre] = useState<string | undefined>();
  const [customGenre, setCustomGenre] = useState<any>();
  const [tag, setTag] = useState<any>();
  // const [date, setDate] = useState(new Date());

  const [newFiles, setNewFiles] = useState<any>(selectedFiles);

  const clickImageInput = (event: any) => {
    event.preventDefault();
    let fileInput = document.getElementById("file-input-upm");
    fileInput?.click();
  };

  const imageToUrl = (event: any) => {
    const reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);
    reader.onload = () => {
      setImageUrl(reader.result);
    };
    setImageFile(event.target.files[0]);
  };

  const changeTitle = (e: any) => {
    setTitle(e.target.value);
  };

  const changeListPermalink = (event: any) => {
    setListPermalink(event.target.value);
  };

  const deleteErrorSet = (id: any, token: any) => {
    axios.delete(`https://api.soundwaffle.com/sets/${id}`, {
      headers: { Authorization: `JWT ${token}` },
    });
  };

  const handlePlaylistUpload = (e: any) => {
    e.preventDefault();
    const myToken = localStorage.getItem("jwt_token");

    // set 만들기
    axios
      .post(
        "https://api.soundwaffle.com/sets",
        {
          title: title,
          permalink: listPermalink ? listPermalink : title,
          type: playlistType,
          description: description,
          genre_input: genre === "custom" ? customGenre : undefined,
          tags_input: tag ? [tag] : undefined,
          is_private: isPrivate,
          image_extension: imageFile
            ? imageFile.name.substr(
                -imageFile.name.length + imageFile.name.indexOf(`.`) + 1
              )
            : undefined,
        },
        {
          headers: {
            Authorization: `JWT ${myToken}`,
          },
        }
      )
      .then((res1) => {
        // set 이미지 업로드 하기
        if (imageFile) {
          const img_options = {
            headers: {
              "Content-Type": imageFile.type,
            },
          };

          axios
            .put(res1.data.image_presigned_url, imageFile, img_options)
            .catch(() => {
              toast("이미지파일 업로드 실패");
            });
        }

        // 개별 track 만들기
        const tracks = Array.from(
          { length: selectedFiles.length },
          (_, i) => i
        );
        tracks.map((item: number) => {
          axios
            .post(
              "https://api.soundwaffle.com/tracks",
              {
                title: newFiles[item].name,
                permalink:
                  newFiles[item].name.indexOf(".") === -1 && listPermalink
                    ? listPermalink + "_" + newFiles[item].name
                    : newFiles[item].name.indexOf(".") === -1 && !listPermalink
                    ? title + "_" + newFiles[item].name
                    : newFiles[item].name.indexOf(".") !== -1 && listPermalink
                    ? listPermalink +
                      "_" +
                      newFiles[item].name.substr(
                        0,
                        newFiles[item].name.indexOf(".")
                      )
                    : title +
                      "_" +
                      newFiles[item].name.substr(
                        0,
                        newFiles[item].name.indexOf(".")
                      ),
                is_private: isPrivate,
                audio_extension: selectedFiles[item].name.substr(
                  -selectedFiles[item].name.length +
                    selectedFiles[item].name.indexOf(`.`) +
                    1
                ),
              },
              {
                headers: {
                  Authorization: `JWT ${myToken}`,
                },
              }
            )
            .then((res2) => {
              const music_options = {
                headers: {
                  "Content-Type": selectedFiles[item].type,
                },
              };
              // S3에 음악파일 업로드
              axios
                .put(
                  res2.data.audio_presigned_url,
                  selectedFiles[item],
                  music_options
                )
                .then(() => {
                  // set에 트랙 추가하기
                  axios
                    .post(
                      `https://api.soundwaffle.com/sets/${res1.data.id}/tracks`,
                      {
                        track_ids: [{ id: res2.data.id }],
                      },
                      {
                        headers: {
                          Authorization: `JWT ${myToken}`,
                        },
                      }
                    )
                    .then(() => {
                      toast("플레이리스트 업로드 성공");
                      setPlaylistModal(false);
                    })
                    .catch(() => {
                      toast("set에 추가 실패");
                    });
                })
                .catch(() => {
                  toast("음악파일 업로드 실패");
                });
            })
            .catch(() => {
              toast(`❗️ ${item + 1} 번째 트랙 제목을 변경해주세요.`);
              setError(true);
              if (!error) {
                deleteErrorSet(res1.data.id, myToken);
              }
            });
        });
      })
      .catch((err) => {
        toast("업로드 실패");
        if (title === "") {
          toast("❗️플레이리스트 제목을 입력하세요.");
        }
        if (
          err.response.data.non_field_errors[0] ===
          "Already existing set permalink for the requested user."
        ) {
          toast("❗️ 플레이리스트 주소가 중복되었습니다.");
        }
      });
  };

  return (
    <div className="playlist-upload-modal">
      <div className="upload-modal-header">
        <div className="upload-basic-info">Basic info</div>
        <div>Metadata</div>
        <div>Permissions</div>
        <div>Advanced</div>
      </div>

      <div className="upload-modal-body">
        <div className="upload-image">
          {!imageUrl && (
            <img
              className="upload-track-img"
              src="https://upload.wikimedia.org/wikipedia/commons/d/d7/Sky.jpg"
              alt="track-img"
            />
          )}
          {imageUrl && (
            <img className="upload-track-img" src={imageUrl} alt="img" />
          )}
          <button onClick={clickImageInput}>
            <img
              src="https://a-v2.sndcdn.com/assets/images/camera-2d93bb05.svg"
              alt="img"
            />
            <div>Upload image</div>
          </button>
          <input
            type="file"
            id="file-input-upm"
            accept=".png"
            onChange={imageToUrl}
          />
        </div>

        <div className="upload-info">
          <div className="upload-info-title">
            <text>Title *</text>
            <input placeholder="Name your playlist" onChange={changeTitle} />
            <div className="upload-info-permalink">
              <div>{`soundcloud.com/${permalink}/sets/`}</div>
              <input
                placeholder="title (default)"
                onChange={changeListPermalink}
              />
            </div>
          </div>
          <div className="uplaod-info-genre-custom">
            <div className="upload-info-genre">
              <text>Genre</text>
              <select onChange={(e: any) => setGenre(e.target.value)}>
                <option value="none">None</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            {genre === "custom" && (
              <div className="upload-info-genre">
                <text>Custom Genre</text>
                <input onChange={(e) => setCustomGenre(e.target.value)} />
              </div>
            )}
          </div>
          <div className="upload-info-genre">
            <text>Playlist type</text>
            <select onChange={(e: any) => setPlaylistType(e.target.value)}>
              <option value="playlist">playlist</option>
              <option value="album">album</option>
            </select>
          </div>
          {/* <div className="upload-info-date">
            <text>Release date</text>
            <DatePicker
              className="datepicker"
              selected={date}
              onChange={(e: any) => setDate(e)}
            />
          </div> */}
          <div className="upload-info-tag">
            <text>Additional tags</text>
            <input
              placeholder="Add tags to describe the genre and mood of your track"
              onChange={(e) => setTag(e.target.value)}
            />
          </div>
          <div className="upload-info-description">
            <text>Description</text>
            <input
              placeholder="Describe your track"
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="upload-info-privacy">
            <text>Privacy:</text>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="flexRadioDefault"
                id="flexRadioDefault2"
                onChange={() => setIsPrivate(false)}
              />
              <label className="form-check-label">Public (default)</label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="flexRadioDefault"
                id="flexRadioDefault1"
                onChange={() => setIsPrivate(true)}
              />
              <label className="form-check-label">Privacy</label>
            </div>
          </div>
        </div>
      </div>

      {trackNum.map((item: number) => (
        <PlaylistTrack
          item={item}
          selectedFiles={selectedFiles}
          newFiles={newFiles}
          setNewFiles={setNewFiles}
        />
      ))}

      <div className="upload-modal-button">
        <button
          className="cancel-button"
          onClick={() => setPlaylistModal(false)}
        >
          Cancel
        </button>
        <button className="save-button" onClick={handlePlaylistUpload}>
          Save
        </button>
      </div>
    </div>
  );
}

export default UploadPlaylistModal;
