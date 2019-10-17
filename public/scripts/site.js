(function ($) {
	'use strict';

    // btn more
    $(document).on('click.site', '.btn-more', function(e) {
			var temp = $(this).next();
			console.log(temp.attr('id'));
			var tempId = temp.attr('id');

			var nameIdString;
			var artistIdString;
			if (tempId.substring(5,6) != "0" && tempId.substring(5,6) != "1" && tempId.substring(5,6) != "2" && tempId.substring(5,6) != "3" && tempId.substring(5,6) != "4" && tempId.substring(5,6) != "5" && tempId.substring(5,6) != "6" && tempId.substring(5,6) != "7" && tempId.substring(5,6) != "8" && tempId.substring(5,6) != "9") {
				nameIdString = "song" + tempId.substring(4,5) + "-title";
				artistIdString = "song" + tempId.substring(4,5) + "-artist";
			}
			else if (tempId.substring(6,7) != "0" && tempId.substring(6,7) != "1" && tempId.substring(6,7) != "2" && tempId.substring(6,7) != "3" && tempId.substring(6,7) != "4" && tempId.substring(6,7) != "5" && tempId.substring(6,7) != "6" && tempId.substring(6,7) != "7" && tempId.substring(6,7) != "8" && tempId.substring(6,7) != "9") {
				nameIdString = "song" + tempId.substring(4,6) + "-title";
				artistIdString = "song" + tempId.substring(4,6) + "-artist";
			}
			else {
				nameIdString = "song" + tempId.substring(4,7) + "-title";
				artistIdString = "song" + tempId.substring(4,7) + "-artist";
			}

			console.log(nameIdString);
			nameIdString = "#" + nameIdString;
			var nameString = $( nameIdString ).html();
			console.log(nameString);

			//var artistIdString = "song" + tempId.substring(4,5) + "-artist";
			console.log(artistIdString);
			artistIdString = "#" + artistIdString;
			var artistString = $( artistIdString ).html();
			console.log(artistString);

			nameString = nameString.replace(/&amp;/, " ");
			artistString = artistString.replace(/&amp;/, " ");




			var hrefString = "http://localhost:3000/downloadSong?name=" + nameString + "&artist=" + artistString;
			console.log(hrefString);

			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					var resp = JSON.parse(this.responseText);
					console.log(resp);
				}
			};

			xmlhttp.open("GET", hrefString);
			xmlhttp.send();

			//send get request
			/*http.get({
				hostname: 'localhost',
				port: 2000,
				path: '/',
				agent: false  // create a new agent just for this one request
			}, (res) => {
				console.log(res);
				//res.download();
			});*/

			var xmlhttp8 = new XMLHttpRequest();
			xmlhttp8.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					var resp = JSON.parse(this.responseText);
					console.log(resp);
				}
			};

			xmlhttp8.open("GET", "http://localhost:2000/");
			xmlhttp8.send();



    });

    $(document).on('click.site', '#search-result a', function(e) {
      $(this).closest('.modal').modal('hide');
    });

})(jQuery);
