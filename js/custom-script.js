(function($) {

	"use strict";

	document.on("contextmenu", function(e) {
		e.preventDefault();
	});

	//Hide Loading Box (Preloader)
	function handlePreloader() {
		if($('.preloader').length){
			$('body').addClass('page-loaded');
			$('.preloader').delay(1000).fadeOut(0);
		}
	}

	//Update Header Style and Scroll to Top
	function headerStyle() {
		if($('.main-header').length){
			var windowpos = $(window).scrollTop();
			var siteHeader = $('.main-header');
			var scrollLink = $('.scroll-to-top');
			var sticky_header = $('.main-header .sticky-header');
			if (windowpos > 100) {
				siteHeader.addClass('fixed-header');
				sticky_header.addClass("animated slideInDown");
				scrollLink.fadeIn(300);
			} else {
				siteHeader.removeClass('fixed-header');
				sticky_header.removeClass("animated slideInDown");
				scrollLink.fadeOut(300);
			}
		}
	}

	headerStyle();

	//Submenu Dropdown Toggle
	if($('.main-header li.dropdown ul').length){
		$('.main-header .navigation li.dropdown').append('<div class="dropdown-btn"><span class="fa fa-angle-right"></span></div>');
	}

	//Mobile Nav Hide Show
	if($('.mobile-menu').length){

		$('.mobile-menu .menu-box').mCustomScrollbar();

		var mobileMenuContent = $('.main-header .nav-outer .main-menu').html();
		$('.mobile-menu .menu-box .menu-outer').append(mobileMenuContent);
		$('.sticky-header .main-menu').append(mobileMenuContent);

		//Dropdown Button
		$('.mobile-menu li.dropdown .dropdown-btn').on('click', function() {
			$(this).toggleClass('open');
			$(this).prev('ul').slideToggle(500);
		});
		//Menu Toggle Btn
		$('.mobile-nav-toggler').on('click', function() {
			$('body').addClass('mobile-menu-visible');
		});

		//Menu Toggle Btn
		$('.mobile-menu .menu-backdrop,.mobile-menu .close-btn').on('click', function() {
			$('body').removeClass('mobile-menu-visible');
		});
	}

	/////////////////////////////
		//Universal Code for All Owl Carousel Sliders
	/////////////////////////////

	if ($('.kausid-carousel').length) {
		$(".kausid-carousel").each(function (index) {
			var $owlAttr = {},
			$extraAttr = $(this).data("options");
			$.extend($owlAttr, $extraAttr);
			$(this).owlCarousel($owlAttr);
		});
	}

	// Donation Progress Bar
	if ($('.count-bar').length) {
		$('.count-bar').appear(function(){
			var el = $(this);
			var percent = el.data('percent');
			$(el).css('width',percent).addClass('counted');
		},{accY: -50});

	}

	//Fact Counter + Text Count
	if($('.count-box').length){
		// First, try to fetch stats from API
		fetch(window.SPAN_API_URL ? window.SPAN_API_URL.replace('/api', '/api/stats') : '/api/stats', {
			headers: { 'Bypass-Tunnel-Reminder': 'true' }
		})
		.then(res => res.json())
		.then(stats => {
			if (stats && stats.length) {
				const statMap = {};
				stats.forEach(s => { statMap[s.key] = s.value; });
				
				// Update HTML data-stop attributes with API values
				$('.count-text').each(function() {
					const $el = $(this);
					const key = $el.data('key');
					if (key && statMap[key] !== undefined) {
						$el.attr('data-stop', statMap[key]);
					}
				});
			}
		})
		.catch(() => {
			// API not available, use default values from HTML
		})
		.finally(() => {
			// Now animate counters
			$('.count-box').appear(function(){

				var $t = $(this),
					n = $t.find(".count-text").attr("data-stop"),
					r = parseInt($t.find(".count-text").attr("data-speed"), 10);

				if (!$t.hasClass("counted")) {
					$t.addClass("counted");
					$({
						countNum: $t.find(".count-text").text()
					}).animate({
						countNum: n
					}, {
						duration: r,
						easing: "linear",
						step: function() {
							$t.find(".count-text").text(Math.floor(this.countNum));
						},
						complete: function() {
							$t.find(".count-text").text(this.countNum);
						}
					});
				}

			},{accY: 0});
		});
	}

	//MixitUp Gallery Filters
	 if($('.filter-list').length){
	 	 $('.filter-list').mixItUp({});
	 }

	 //Sortable Masonary with Filters
	function enableMasonry() {
		if($('.sortable-masonry').length){

			var winDow = $(window);
			// Needed variables
			var $container=$('.sortable-masonry .items-container');
			var $filter=$('.filter-btns');

			$container.isotope({
				filter:'*',
				 masonry: {
					columnWidth : '.masonry-item.col-lg-4'
				 },
				animationOptions:{
					duration:500,
					easing:'linear'
				}
			});



			// Isotope Filter
			$filter.find('li').on('click', function(){
				var selector = $(this).attr('data-filter');

				try {
					$container.isotope({
						filter	: selector,
						animationOptions: {
							duration: 500,
							easing	: 'linear',
							queue	: false
						}
					});
				} catch(err) {

				}
				return false;
			});


			winDow.on('resize', function(){
				var selector = $filter.find('li.active').attr('data-filter');

				$container.isotope({
					filter	: selector,
					animationOptions: {
						duration: 500,
						easing	: 'linear',
						queue	: false
					}
				});
			});


			var filterItemA	= $('.filter-btns li');

			filterItemA.on('click', function(){
				var $this = $(this);
				if ( !$this.hasClass('active')) {
					filterItemA.removeClass('active');
					$this.addClass('active');
				}
			});
		}
	}

	enableMasonry();


	//Tabs Box
	if($('.tabs-box').length){
		$('.tabs-box .tab-buttons .tab-btn').on('click', function(e) {
			e.preventDefault();
			var target = $($(this).attr('data-tab'));

			if ($(target).is(':visible')){
				return false;
			}else{
				target.parents('.tabs-box').find('.tab-buttons').find('.tab-btn').removeClass('active-btn');
				$(this).addClass('active-btn');
				target.parents('.tabs-box').find('.tabs-content').find('.tab').fadeOut(0);
				target.parents('.tabs-box').find('.tabs-content').find('.tab').removeClass('active-tab');
				$(target).fadeIn(300);
				$(target).addClass('active-tab');
			}
		});
	}

	//Accordion Box
	if($('.accordion-box').length){
		$(".accordion-box").on('click', '.acc-btn', function() {

			var outerBox = $(this).parents('.accordion-box');
			var target = $(this).parents('.accordion');

			if($(this).hasClass('active')!==true){
				$(outerBox).find('.accordion .acc-btn').removeClass('active');
			}

			if ($(this).next('.acc-content').is(':visible')){
				return false;
			}else{
				$(this).addClass('active');
				$(outerBox).children('.accordion').removeClass('active-block');
				$(outerBox).find('.accordion').children('.acc-content').slideUp(300);
				target.addClass('active-block');
				$(this).next('.acc-content').slideDown(300);
			}
		});
	}

	//Custom Seclect Box
	if($('.custom-select-box').length){
		$('.custom-select-box').selectmenu().selectmenu('menuWidget').addClass('overflow');
	}

	//Default Load More Elements / Causes / Events
	if($('.load-more-section').length){
		var SliceCount = $('.load-more-section').attr('data-load-number');
		$(".load-more-section .load-more-btn").on('click', function (e) {
			e.preventDefault();
			//alert(sliceCount);
			$(".load-more-section .load-more-item:hidden").slice(0, SliceCount).fadeIn(500);
			if ($(".load-more-section .load-more-item:hidden").length < SliceCount) {
				$(".load-more-section .load-more-item:hidden").fadeIn(500);
				$(".load-more-section .load-more-btn").text('No More Items').delay(1000).fadeOut(300);
			}
		});
	}

	//LightBox / Fancybox
	if($('.lightbox-image').length) {
		$('.lightbox-image').fancybox({
			openEffect  : 'fade',
			closeEffect : 'fade',
			helpers : {
				media : {}
			}
		});
	}

	//Event Countdown Timer
	if($('.time-countdown').length){
		$('.time-countdown').each(function() {
			var $this = $(this), finalDate = $(this).data('countdown');
			$this.countdown(finalDate, function(event) {
				var $this = $(this).html(event.strftime('' + '<div class="counter-column"><div class="column-inner"><span class="count">%D</span>Days</div></div> ' + '<div class="counter-column"><div class="column-inner"><span class="count">%H</span>Hours</div></div>  ' + '<div class="counter-column"><div class="column-inner"><span class="count">%M</span>Mins</div></div>  ' + '<div class="counter-column"><div class="column-inner"><span class="count">%S</span>Secs</div></div>'));
			});
		});
	}

	if($('.paroller').length){
		$('.paroller').paroller({
			  factor: 0.2,            // multiplier for scrolling speed and offset, +- values for direction control
			  factorLg: 0.3,          // multiplier for scrolling speed and offset if window width is less than 1200px, +- values for direction control
			  type: 'foreground',     // background, foreground
			  direction: 'horizontal' // vertical, horizontal
		});
	}

	//Contact Form Validation
	if($('#contact-form').length){
		$('#contact-form').validate({
			rules: {
				username: {
					required: true
				},
				email: {
					required: true,
					email: true
				},
				message: {
					required: true
				}
			}
		});
	}

	// Scroll to a Specific Div
	if($('.scroll-to-target').length){
		$(".scroll-to-target").on('click', function() {
			var target = $(this).attr('data-target');
		   // animate
		   $('html, body').animate({
			   scrollTop: $(target).offset().top
			 }, 1500);

		});
	}

	// Elements Animation
	if($('.wow').length){
		var wow = new WOW(
		  {
			boxClass:     'wow',      // animated element css class (default is wow)
			animateClass: 'animated', // animation css class (default is animated)
			offset:       0,          // distance to the element when triggering the animation (default is 0)
			mobile:       false,       // trigger animations on mobile devices (default is true)
			live:         true       // act on asynchronously loaded content (default is true)
		  }
		);
		wow.init();
	}



/* ==========================================================================
   When document is Scrollig, do
   ========================================================================== */

$(window).on('scroll', function() {
	headerStyle();
});

/* ==========================================================================
   When document is loading, do
   ========================================================================== */

$(window).on('load', function() {
	handlePreloader();
	enableMasonry();
});

// Disable copy, cut, and paste to prevent content theft
document.addEventListener('copy', function(e) {
	e.preventDefault();
	// Optional: Show a message to user
	// alert('Copying is disabled on this website.');
	return false;
});

document.addEventListener('cut', function(e) {
	e.preventDefault();
	return false;
});

document.addEventListener('paste', function(e) {
	e.preventDefault();
	return false;
});

// TEMPORARILY DISABLED - Right-click protection
// document.addEventListener('contextmenu', function(e) {
// 	e.preventDefault();
// 	return false;
// });

// TEMPORARILY DISABLED - Right-click protection
// document.addEventListener('contextmenu', function(e) {
// 	e.preventDefault();
// 	return false;
// });

// TEMPORARILY DISABLED - Disable keyboard shortcuts for developer tools
// document.addEventListener('keydown', function(e) {
// 	// Block F12
// 	if (e.keyCode === 123) {
// 		e.preventDefault();
// 		return false;
// 	}
// 	// Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
// 	if (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) {
// 		e.preventDefault();
// 		return false;
// 	}
// 	// Block Ctrl+U (view page source)
// 	if (e.ctrlKey && e.keyCode === 85) {
// 		e.preventDefault();
// 		return false;
// 	}
// });

// Optional: Detect if dev tools are open and take action
(function() {
	var threshold = 160;
	if (window.WebKitWebView) {
		// For iOS web views
		return;
	}
	var profile = function profiler() {
		if (!console.profile) {
			return;
		}
		console.profile();
		console.profileEnd();
		// If we see anything in the console, devtools are open
		if (console.clear) {
			console.clear();
		}
		if (typeof console.profiles === "object") {
			if (console.profiles.length > 0) {
				console.profiles = [];
				alert("Developer tools detection: Please close dev tools to continue.");
				// Optionally redirect or hide content
				// document.body.innerHTML = "<h1>Developer tools detected. Please close them to access the site.</h1>";
			}
		}
	};
	if (typeof console.profiles === "object" && console.profiles.length > 0) {
		alert("Developer tools detection: Please close dev tools to continue.");
	}
	setInterval(profile, 500);
})();

})(window.jQuery);