
var should = chai.should();

var fixtures = {
  testnet: {
    passphrase: "voice flame certainly anyone former raw limit king rhythm tumble crystal earth",
    passphrase2: "flame voice certainly anyone former raw limit king rhythm tumble crystal earth",
    addresses: ["muYJYjRZDPmTEMfyEGe34BGN8tZ6rmRZCu", "mkvaJJCpMMjvhaHodDCvstZsZwTaWR4w3M", "msj2PuwQRMWEmsi75GDcERXygw63BTRX7W"],
    oldaddresses: ["mruvPH9j2QB1P7FGdyuG2wHuqjmPM6xJYa", "n3gQYQceiTbFboggAKb6qZNpxPsrkeNLqE", "n3hiTgJfVLg1ChtFJ6CQJA3azTMr5GFhT8"],
    privkey: "5b720efb03dd889523cf61d9aefac8dce1bf7609f42abd0cf10b57f743b3fb2d", //muYJYjRZDPmTEMfyEGe34BGN8tZ6rmRZCu
    pubkey: "02b6f17e170c40a6b1cdbb4572b172175199122b01f81a56a2d2666a035ed5feef", //muYJYjRZDPmTEMfyEGe34BGN8tZ6rmRZCu
    wif: "cQeTd6ap99KQYNr3jaZkANTKfk32CEfYjnZVNZdLKDfHoPxjVn5K", //muYJYjRZDPmTEMfyEGe34BGN8tZ6rmRZCu
    transaction: {
      unsigned: '010000000139bd8a5a854b46ed4c977ff67350b34cc1945b37544c5de46d7c3ce1b735cb93020000001976a91499d31556557ce86ab75fcb74683efba1bde2815e88acffffffff036c2a0000000000001976a9143b504036641eac98e17d7129f97fd119f572d3a088ac6c2a00000000000047512102b6f17e170c40a6b1cdbb4572b172175199122b01f81a56a2d2666a035ed5feef211c434e545250525459000000000000000000000001000000000bebc2000000000052aeee046435000000001976a91499d31556557ce86ab75fcb74683efba1bde2815e88ac00000000',
      signed: '010000000139bd8a5a854b46ed4c977ff67350b34cc1945b37544c5de46d7c3ce1b735cb93020000006b483045022079be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798022100c87b6f22379bc1892965893a059d0fa3a03f342cd871e9f76d220f9f36e399e7012102b6f17e170c40a6b1cdbb4572b172175199122b01f81a56a2d2666a035ed5feefffffffff036c2a0000000000001976a9143b504036641eac98e17d7129f97fd119f572d3a088ac6c2a00000000000047512102b6f17e170c40a6b1cdbb4572b172175199122b01f81a56a2d2666a035ed5feef211c434e545250525459000000000000000000000001000000000bebc2000000000052aeee046435000000001976a91499d31556557ce86ab75fcb74683efba1bde2815e88ac00000000',
      source: 'muYJYjRZDPmTEMfyEGe34BGN8tZ6rmRZCu',
      destination: 'mkvaJJCpMMjvhaHodDCvstZsZwTaWR4w3M'
    }
  },
  livenet: {

  }
}
var data = fixtures[NETWORK.name]

describe('BIP32 addresses', function() {

  it('Should correctly generate addresses from passphrase', function() {
    var bip32 = new CWBIP32(data.passphrase);
    for (var i=0; i<3; i++) {
      var cwk = bip32.getAddressKey(i);
      var address = cwk.getAddress();
      address.should.be.a('string');
      address.should.equal(data.addresses[i]);
      console.log(cwk.getWIF());
    }
  });

  it('Should correctly generate old addresses from passphrase', function() {
    var bip32 = new CWBIP32('old '+data.passphrase);
    for (var i=0; i<3; i++) {
      var cwk = bip32.getAddressKey(i);
      var address = cwk.getAddress();
      address.should.be.a('string');
      address.should.equal(data.oldaddresses[i]);
    }
  });

  it('Should generate different addresses from diffrent passphrase', function() {
    var bip32 = new CWBIP32(data.passphrase2);
    for (var i=0; i<3; i++) {
      var cwk = bip32.getAddressKey(i);
      var address = cwk.getAddress();
      address.should.be.a('string');
      address.should.not.equal(data.addresses[i]);
    }
  });

  it('Should generate different old addresses from diffrent passphrase', function() {
    var bip32 = new CWBIP32('old '+data.passphrase2);
    for (var i=0; i<3; i++) {
      var cwk = bip32.getAddressKey(i);
      var address = cwk.getAddress();
      address.should.be.a('string');
      address.should.not.equal(data.addresses[i]);
    }
  });

  it('Should correctly validate address', function() {
    CWBitcore.isValidAddress(data.addresses[0]).should.equal.true;
    var badAddress = data.addresses[0].replace(/u/g, "v");
    CWBitcore.isValidAddress(badAddress).should.equal.false;
  });

});


describe('Private keys methods', function() {

  it('Should correctly instanciate CWPrivateKey object', function() {
    var cwk = new CWPrivateKey(data.privkey);
    cwk.getAddress().should.be.equal(data.addresses[0]);
    cwk.getPub().should.be.equal(data.pubkey);
    cwk.isValid().should.be.equal.true;
    cwk.getWIF().should.be.equal(data.wif);
  });

  it('Should correctly sign transaction', function() {
    var cwk = new CWPrivateKey(data.privkey);
    var signed = cwk.signRawTransaction(data.transaction.unsigned);
    signed.should.be.equal(data.transaction.signed);
  });

  it('Should reject transaction with incorrect destination', function() {
    var cwk = new CWPrivateKey(data.privkey);
    var check = cwk.checkTransactionDest(data.transaction.unsigned, data.addresses[2]);
    check.should.be.equal.false;
  });


});
