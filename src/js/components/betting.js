
function FeedBrowserViewModel() {

  var self = this;

  var wagerValidator = {
    required: true,
    isValidPositiveQuantity: self,
    validation: {
      validator: function (val, self) {
        var address = self.sourceAddress();
        var wager = self.wager();

        $.jqlog.debug('address: '+address);
        $.jqlog.debug('balances: '+self.balances[address]);
        $.jqlog.debug('wager: '+wager);

        return parseFloat(wager) <= self.balances[address];
      },
      message: 'Quantity entered exceeds the address balance.',
      params: self
    }    
  }
  
  
  self.feed = ko.observable(null);
  self.targetValue = ko.observable(0);
  self.targetValueText = ko.observable('');
  self.betType = ko.observable('');
  self.betTypeCounter = ko.observable('');
  self.betTypeLabelEqual = ko.observable('Equal');
  self.betTypeLabelNotEqual = ko.observable('NotEqual');
  self.deadlines = ko.observableArray([]);
  self.deadline = ko.observable(0);
  self.availableAddresses = ko.observableArray([]);
  self.sourceAddress = ko.observable(null).extend(wagerValidator);
  self.balances = {};
	self.wager = ko.observable(null).extend(wagerValidator);
  self.odd = ko.observable(1);
  self.counterBets = ko.observableArray([]);
  self.selectedCounterBetTx = ko.observable(null);
  self.matchingVolume = ko.observable(0);
  self.openingVolume = ko.observable(0);
  self.fee = ko.observable(0);
  self.showAdvancedOptions = ko.observable(false);
  self.currentStep = ko.observable(0);
  self.sourceAddress = ko.observable('');
  self.greenPercent = ko.observable(20);
  self.feedStats = ko.observableArray([]);

  self.counterwager = ko.observable(null).extend({
    required: true,
    isValidPositiveQuantity: self    
  });

  self.feedUrl = ko.observable('').extend({
    required: false,
    isValidUrlOrValidBitcoinAdress: self
  });
  
  self.feedUrl.subscribe(function(val) {
    if (self.feedUrl.isValid()) {
      self.loadFeed();
    }
  });

  self.targetValue.subscribe(function(val) {
  	// pepare bet type labels
  	var labelEqual = 'Equal', labelNotEqual = 'NotEqual', labelTargetValue = 'target_value = '+val;
  	for (var i in self.feed().info_data.outcomes) {
  		if (self.feed().info_data.outcomes[i].target_value == val) {
  			if (self.feed().info_data.outcomes[i].labels) {
  				labelEqual = self.feed().info_data.outcomes[i].labels.equal + ' (Equal)';
  				labelNotEqual = self.feed().info_data.outcomes[i].labels.not_equal + ' (NotEqual)';
  				labelTargetValue = self.feed().info_data.outcomes[i].long_text;
  				break;
  			}
  		}
  	}
  	self.betTypeLabelEqual(labelEqual);
  	self.betTypeLabelNotEqual(labelNotEqual);
  	self.targetValueText(labelTargetValue)
  });

  self.betType.subscribe(function(val) {
  	if (val=='') return;
  	self.betTypeCounter(BET_TYPES[COUNTER_BET[val]]);
  	self.loadCounterBets();
  });

  self.wager.subscribe(function(value) {
    try {
    	var c = mulFloat(self.odd(), value);
      self.counterwager(c);
      var f = mulFloat(divFloat(self.feed().fee_fraction_int, UNIT), value);
      self.fee(f);      
    } catch(e) {
      self.counterwager(0);
      self.fee(0);
    }
    self.updateMatchingVolume();
  });

  self.odd.subscribe(function(value) {
    try {
    	var c = mulFloat(self.wager(), value);
      self.counterwager(c);
    } catch(e) {
      self.counterwager(0);
    }  
    self.updateMatchingVolume();
  });

  self.expiration = ko.observable(1000).extend({
    required: true,
    isValidPositiveInteger: self
  });

  self.counterwager.subscribe(function() {
  	var t = addFloat(self.wager(), self.counterwager())
  	var p = divFloat(t, 100);
  	var g = divFloat(self.wager(), p);
  	if (self.betType == 'NotEqual') {
  		g = divFloat(self.counterwager(), p);
  	}
  	self.greenPercent(g);
  });

  self.validationModel = ko.validatedObservable({
    wager: self.wager,
    counterwager: self.counterwager,
    expiration: self.expiration
  });

  $('#feedWizard').bootstrapWizard({
      tabClass: 'form-wizard',
      nextSelector: 'li.next',
      onTabClick: function(tab, navigation, index) {
      	$.jqlog.debug("TAB CLICK: "+tab);
        return true; //tab click disabled
      },
      onTabShow: function(tab, navigation, index) {
      	$.jqlog.debug("TAB: "+index);
      	if (index==0) {
      		$('li.previous').addClass('disabled');
			  	$('li.next').show();
			  	$('li.next.finish').hide();
      	} else if (index==1) {
      		$('li.previous').removeClass('disabled');
  				$('li.next').hide();
  				$('li.next.finish').removeClass('disabled').show();
      	} else {
      		return false;
      	}
      	self.currentStep(index);
      	return true;
      },
      onNext: function (tab, navigation, index) {
      	$.jqlog.debug("NEXT CLICK: "+index);
      	return true;
      }
   });

  self.init = function() {
  	$('li.next').addClass('disabled');
  	$('li.previous').addClass('disabled');
  	$('li.next.finish').hide();
  }

  self.displayFeed = function(feed) {  

  	// prepare source addresses
  	self.availableAddresses([]);
    self.balances = {};
    var addresses = WALLET.getAddressesList(true);
    var options = []
    for(var i = 0; i < addresses.length; i++) {
      options.push({
        address: addresses[i][0], 
        label: addresses[i][1] + ' (' + addresses[i][2] + ' XCP)'
      });
      self.balances[addresses[i][0]] = addresses[i][2];
    }
    self.availableAddresses(options);
  	
  	// prepare images url
    feed.info_data.owner.image_url = feed.info_data.owner.valid_image ? feedImageUrl(feed.source + '_owner') : '';
    feed.info_data.event.image_url = feed.info_data.event.valid_image ? feedImageUrl(feed.source + '_event') : '';
    for (var i in feed.info_data.outcomes) {
    	var image_name = feed.source + '_tv_' + feed.info_data.outcomes[i].target_value;
    	feed.info_data.outcomes[i].image_url = feed.info_data.outcomes[i].valid_image ? feedImageUrl(image_name) : '';
    	feed.info_data.outcomes[i].long_text = feed.info_data.outcomes[i].text + ' (value: ' + feed.info_data.outcomes[i].target_value + ')';
    }
    // prepare fee
    feed.fee = satoshiToPercent(feed.fee_fraction_int);
    // prepare deadlines
    deadlines = [];
    for (var d in feed.info_data.deadlines) {
      deadlines.push({
        text: feed.info_data.deadlines[d],
        timestamp: feed.info_data.deadlines[d]
      });
    }
    feed.info_data.deadlines = deadlines;
    feed.info_data.deadline = deadlines[0].text;
    // prepare counters
    var classes = {
    	'open': 'success',
    	'filled': 'primary',
    	'expired': 'danger'
    };
    for (var i in feed.counters.bets) {
    	feed.counters.bets[i].wager_quantity = normalizeQuantity(feed.counters.bets[i].wager_quantity) + ' XCP';
    	feed.counters.bets[i].wager_remaining = normalizeQuantity(feed.counters.bets[i].wager_remaining) + ' XCP';
    	feed.counters.bets[i].status_html = '<span class="label label-'+classes[feed.counters.bets[i].status]+'">'+feed.counters.bets[i].status+'</span>';

    }
    self.feedStats(feed.counters.bets)
    feed.info_data.event.date_str = moment(feed.info_data.event.date).format('LLLL');

    $.jqlog.debug(feed);
    self.feed(feed);
    self.feedStats(feed.counters.bets);
    self.betType(''); // to force change event
    self.betType('Equal');
    self.wager(1);
    $('li.next').removeClass('disabled');
  }

  self.loadFeed = function() {
    failoverAPI('get_feed', {'address_or_url': self.feedUrl()}, self.displayFeed)
  }

  self.getFeedImageUrl = function(image_type) {
    return "/feed.png";
  }

  self.loadCounterBets = function() {
    if (!self.betType() ||  !self.feed() || !self.deadline() || !self.targetValue()) return false;
    var params = {
      bet_type: COUNTER_BET[self.betType()],
      feed_address: self.feed().source,
      target_value: self.targetValue(),
      deadline: moment(self.deadline()).unix(),
      leverage: 5040,

    };

    var onCounterbetsLoaded = function(data) {
      $.jqlog.debug(data);

      // prepare data for display. TODO: optimize, all in one loop
      var displayedData = []
      for (var b = data.length-1; b>=0; b--) {
        bet = {}
        bet.deadline_str = timestampToString(data[b].deadline);
        bet.ratio = reduce(data[b].wager_quantity, data[b].counterwager_quantity).join('/');
        bet.multiplier = divFloat(parseInt(data[b].wager_quantity), parseInt(data[b].counterwager_quantity));
        bet.multiplier = Math.floor(bet.multiplier*100) / 100;
        bet.wager = satoshiToXCP(data[b].wager_remaining);
        bet.wager_remaining = data[b].wager_remaining;
        bet.counterwager_remaining = data[b].counterwager_remaining;
        bet.counterwager = satoshiToXCP(data[b].counterwager_remaining);
        bet.tx_index = data[b].tx_index;
        bet.bet_count = 1;
        displayedData.push(bet);
      }
      var displayedData2 = [];
      if (displayedData.length>0) {
        // sort by multiplier desc   
        displayedData.sortBy("-multiplier");
        // agregate bets
        displayedData2 = [displayedData[0]];
        for (var b = 1; b < displayedData.length; b++) {
          if (displayedData[b].multiplier == displayedData[b-1].multiplier) {
            var i = displayedData2.length-1;
            displayedData2[i].wager_remaining += displayedData[b].wager_remaining;
            displayedData2[i].counterwager_remaining += displayedData[b].counterwager_remaining;
            displayedData2[i].wager = satoshiToXCP(displayedData2[i].wager_remaining);
            displayedData2[i].bet_count += displayedData[b].bet_count;
          } else {
            displayedData2.push(displayedData[b]);
          }
        }
        // calculate volume
        for (var b = 0; b < displayedData2.length; b++) {
          var previousVolume = 0;
          if (b>0) displayedData2[b].volume = displayedData2[b-1].volume + displayedData2[b].wager_remaining;
          else displayedData2[b].volume = displayedData2[b].wager_remaining;

          previousVolume = 0;
          if (b>0) displayedData2[b].countervolume = displayedData2[b-1].countervolume + displayedData2[b].counterwager_remaining;
          else displayedData2[b].countervolume = displayedData2[b].counterwager_remaining;

          displayedData2[b].volume_str = satoshiToXCP(displayedData2[b].countervolume);
        }
      }

      self.counterBets(displayedData2);
      if (displayedData2.length>0) {
        self.selectCounterbet(displayedData2[0]);
      } else {
        self.counterwager(1);
        self.odd(1);
      }
      
    }

    failoverAPI('get_bets', params, onCounterbetsLoaded);
  }

  self.selectCounterbet = function(counterbet) {
    $.jqlog.debug(counterbet);
    var cw = mulFloat(self.wager(), counterbet.multiplier);
    cw = Math.floor(cw*10000) / 10000;

    self.counterwager(cw);
    self.odd(counterbet.multiplier);
    //self.deadline(counterbet.deadline * 1000);
    self.selectedCounterBetTx(counterbet.tx_index);
    $('#betting #counterbets tr').removeClass('selectedCounterBet');
    $('#cb_'+counterbet.tx_index).addClass('selectedCounterBet');
  }

  self.getVolumeFromOdd = function(value) {
    var books = self.counterBets();
    if (books.length==0) return 0;
    var volume = 0;
    for (var i=0; i<books.length; i++) {
      if (books[i].multiplier>=value) {
        volume = books[i].countervolume;
      } else {
        break;
      }
    }
    return volume;
  }

  self.updateMatchingVolume = function() {
    var odd = self.odd();
    var wager = self.wager();
    var volume = self.getVolumeFromOdd(odd) / UNIT;
    var winning = self.counterwager()

    $.jqlog.debug('updateMatchingVolume');
    $.jqlog.debug('volume: ' + volume);
    $.jqlog.debug('winning: ' + wager);
    $.jqlog.debug('odd: ' + odd);

    var matching = Math.min(volume, wager);
    var opening = (wager - matching);

    self.matchingVolume(round(matching, 4));
    self.openingVolume(round(opening, 4)); 
  }

  self.nextStep = function() {
  	$('#feedWizard').bootstrapWizard('next');
  }

  self.previousStep = function() {
  	$('#feedWizard').bootstrapWizard('previous');
  }

  self.submitBet = function() {
  	if (!self.validationModel.isValid()) {
      self.validationModel.errors.showAllMessages();
      return false;
    }
    
    var params = {
      source: self.sourceAddress(),
      feed_address: self.feed().source,
      bet_type: self.betType(),
      deadline: moment(self.deadline()).unix(),
      wager: denormalizeQuantity(self.wager()),
      counterwager: denormalizeQuantity(self.counterwager()),
      expiration: parseInt(self.expiration()),
      target_value: self.targetValue(),
      leverage: 5040
    }
    $.jqlog.debug(params);

    var onSuccess = function(txHash, data, endpoint) {
      bootbox.alert("<b>Your funds were sent successfully.</b> " + ACTION_PENDING_NOTICE);
    }

    WALLET.doTransaction(self.sourceAddress(), "create_bet", params, onSuccess);
  }


}


/*NOTE: Any code here is only triggered the first time the page is visited. Put JS that needs to run on the
  first load and subsequent ajax page switches in the .html <script> tag*/
