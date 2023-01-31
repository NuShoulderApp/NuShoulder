import React from "react";
import { compose, withApollo } from "react-apollo";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
	getSignedUrl
} from "./files_graphql";

const fileIconMap = {
	"application/pdf": "file-pdf",
	"image/tiff": "file-image",
	"image/jpeg": "file-image",
	"image/bmp": "file-image",
	"image/png": "file-image",
	"image.gif": "file-image",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": "file-word",
	"application/msword": "file-word",
	"application/rtf": "file-word",
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "file-excel",
	"application/vnd.ms-excel": "file-excel",
	"text/csv": "file-excel"
  }

  function getFileIcon(contentType){
	if(fileIconMap.hasOwnProperty(contentType)){
	  return fileIconMap[contentType];
	} else {
	  return "fa-file";
	}
  }

  const FileDownloadLinkContent = (props) => {
	const {
		label="Download",
		className="",
		File: {
			fileId,
			mimeType
		},
		client: { query }
	} = props;

	async function downloadFile(fileId){
	  const result = await query({
		  query: getSignedUrl,
		  variables: { fileId },
		  fetchPolicy: "network-only"
	  });

	  window.open(result.data.File.location);
	}

	 return (
	  <button
		  type="button"
		  className={className}
		  onClick={() => downloadFile(fileId)}
	  >
	  	<FontAwesomeIcon icon={getFileIcon(mimeType)} />
		{label}
	  </button>
	);
  };

export const FileDownloadLink = compose(
	withApollo
)(FileDownloadLinkContent);
