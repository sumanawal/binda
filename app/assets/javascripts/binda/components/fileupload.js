/**
 * FILE UPLOAD
 *
 * see https://tympanus.net/codrops/2015/09/15/styling-customizing-file-inputs-smart-way/
 *
 */

class FileUpload {
	constructor() {
		this.target = ".fileupload";
	}

	isPresent() {
		if ($(this.target).length > 0) {
			return true;
		} else {
			return false;
		}
	}

	setEvents() {
		let self = this;

		$(document).on("click", ".fileupload--remove-image-btn", remove_preview);

		$(document).on("change", `${this.target} input.file`, handle_file);
	}
}

export let _FileUpload = new FileUpload();

/**
 * HELPER FUNCTIONS
 */

// Reference --> http://blog.teamtreehouse.com/uploading-files-ajax
function handle_file(event) {
	let id = event.target.getAttribute("data-id");
	let $parent = $("#fileupload-" + id);

	// Get the selected file from the input
	// This script doesn't consider multiple files upload
	let file = event.target.files[0];

	// Don't go any further if no file has been selected
	if (typeof file == "undefined") {
		return;
	}

	// Create a new FormData object which will be sent to the server
	let formData = new FormData();

	// Get data from the input element
	$parent.find("input").each(function() {
		if (this.isSameNode(event.target)) {
			// Add the file to the request
			formData.append(this.getAttribute("name"), file, file.name);
		} else {
			// Add secondary values to the request
			formData.append(this.getAttribute("name"), this.getAttribute("value"));
		}
	});

	// If it's inside a repeater add repeater parameters
	let $parent_repeater = $parent.closest(".form-item--repeater-fields");
	if ($parent.closest(".form-item--repeater-fields").length > 0) {
		gatherData($parent_repeater, formData);
	}

	// Is this needed? Apparently it works without it. Is it a security issue?
	// let token = document.querySelector('meta[name="csrf-token"]').content
	// formData.append('authenticity_token', token)

	// Display loader
	$(".popup-warning--message").text($parent.data("message"));
	$(".popup-warning").removeClass("popup-warning--hidden");

	// Once form data are gathered make the request
	makeRequest(event, formData);
}

function gatherData($parent_repeater, formData) {
	$parent_repeater
		.children(".form-group")
		.find("input")
		.each(function() {
			formData.append(this.getAttribute("name"), this.getAttribute("value"));
		});
}

function makeRequest(event, formData) {
	let id = event.target.getAttribute("data-id");
	let $parent = $("#fileupload-" + id);
	// Make request
	$.ajax({
		url: event.target.getAttribute("data-url"),
		type: "PATCH",
		processData: false, // needed to pass formData with the current format
		contentType: false, // needed to pass formData with the current format
		data: formData
	})
		.done(function(data) {
			updateFileuploadField(data, id);
		})
		.fail(function(dataFail) {
			// Hide loaded
			$(".popup-warning").addClass("popup-warning--hidden");
			alert($parent.data("error"));
		});
}

function updateFileuploadField(data, id) {
	let $parent = $("#fileupload-" + id);

	if (data.type == "image") {
		setup_image_preview(data, id);
	} else if (data.type == "video") {
		setup_video_preview(data, id);
	} else if (data.type == "audio") {
		setup_audio_preview(data, id);
	} else if (data.type == "svg") {
		setup_svg_preview(data, id);
	} else {
		alert("Something went wrong. No preview has been received.");
	}

	// Hide loaded
	$(".popup-warning").addClass("popup-warning--hidden");

	// Display details and buttons
	$parent
		.find(".fileupload--details")
		.removeClass("fileupload--details--hidden");
	$parent
		.find(".fileupload--remove-image-btn")
		.removeClass("fileupload--remove-image-btn--hidden");
}

function reset_file(input) {
	input.value = "";

	if (!/safari/i.test(navigator.userAgent)) {
		input.type = "";
		input.type = "file";
	}
}

function remove_preview(event) {
	let id = event.target.getAttribute("data-id");
	let $parent = $("#fileupload-" + id);

	// Reset previews (either image or video)
	$parent
		.find(".fileupload--preview")
		.css("background-image", "")
		.removeClass("fileupload--preview--uploaded");
	$parent.find("video source").removeAttr("src");

	// Clear input field
	reset_file($parent.find("input[type=file]").get(0));

	// Reset buttons to initial state
	$parent
		.find(".fileupload--remove-image-btn")
		.addClass("fileupload--remove-image-btn--hidden");
	$parent.find(".fileupload--details").addClass("fileupload--details--hidden");
}

function setup_image_preview(data, id) {
	let $parent = $("#fileupload-" + id);
	let $preview = $("#fileupload-" + id + " .fileupload--preview");

	// Update thumbnail
	$preview.css("background-image", `url(${data.thumbnailUrl})`);

	// Remove and add class to trigger css animation
	let uploadedClass = "fileupload--preview--uploaded";
	$preview.removeClass(uploadedClass).addClass(uploadedClass);

	// Update details
	$parent.find(".fileupload--width").text(data.width);
	$parent.find(".fileupload--height").text(data.height);
	$parent.find(".fileupload--filesize").text(data.size);
	$parent.find(".fileupload--filename").text(data.name);
}

function setup_video_preview(data, id) {
	let $parent = $("#fileupload-" + id);
	let $preview = $("#fileupload-" + id + " .fileupload--preview");
	let uploadedClass = "fileupload--preview--uploaded";

	$preview
		.removeClass(uploadedClass)
		.find("video")
		.attr("id", "video-" + id)
		.find("source")
		.attr("src", data.url)
		.attr("type", data.contentType);

	// If video source isn't blank load it (consider that a video tag is always present)
	if (typeof $preview.find("video source").attr("src") != undefined) {
		$preview
			.find("video")
			.get(0)
			.load();
	}

	// Remove and add class to trigger css animation
	$preview.addClass(uploadedClass);

	// Update details
	$parent.find(".fileupload--filesize").text(data.size);
	$parent.find(".fileupload--filename").text(data.name);
	$parent.find(".fileupload--previewlink a").attr("href", data.url);
}

function setup_audio_preview(data, id) {
	let $parent = $("#fileupload-" + id);
	let $preview = $("#fileupload-" + id + " .fileupload--preview");
	let uploadedClass = "fileupload--preview--uploaded";

	$preview
		.removeClass(uploadedClass)
		.find("audio")
		.attr("id", "audio-" + id)
		.find("source")
		.attr("src", data.url)
		.attr("type", data.contentType);

	// If video source isn't blank load it (consider that a video tag is always present)
	if (typeof $preview.find("audio source").attr("src") != undefined) {
		$preview
			.find("audio")
			.get(0)
			.load();
	}

	// Remove and add class to trigger css animation
	$preview
		.addClass(uploadedClass)
		.addClass("fileupload--preview--hidden")

	// Update details
	$parent.find(".fileupload--filesize").text(data.size);
	$parent.find(".fileupload--filename").text(data.name);
	$parent.find(".fileupload--previewlink a").attr("href", data.url);
}

function setup_svg_preview(data, id) {
	let $parent = $("#fileupload-" + id);
	let $preview = $("#fileupload-" + id + " .fileupload--preview");
		
	// Update thumbnail
	$preview.css("background-image", `url(${data.thumbnailUrl})`);

	// Remove and add class to trigger css animation
	let uploadedClass = "fileupload--preview--uploaded";
	$preview.removeClass(uploadedClass).addClass(uploadedClass);

	// Update details
	$parent.find(".fileupload--filesize").text(data.size);
	$parent.find(".fileupload--filename").text(data.name);
	$parent.find(".fileupload--previewlink a").attr("href", data.url);
}
