var fs = require('fs');
const readline = require('readline');

var pattern = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
var data = fs.readFileSync('D:\\IP_city.dat', function(err, data) {
  if (err) {
    console.error('not found file');
    return '';
  }
  return data;
  console.log('read file over');
});

function _ip2int(ip) {
  var num = 0;
  ip = ip.split('.');
  num = Number(ip[0]) * 256 * 256 * 256 + Number(ip[1]) * 256 * 256 + Number(ip[2]) * 256 + Number(ip[3]);
  num = num >>> 0;
  return num;
}

function bufferRev2intIp(buffer) {
  // change type from buffer to object
  var obj = JSON.parse(JSON.stringify(buffer));
  // get ip of array, and reverse it
  var arr = obj.data.reverse();
  // join '.' in array, then it will be string
  var str = arr.join('.');
  // transferm string ip to int ip
  return _ip2int(str);
}

// offset_info = data.slice(16, data.length - 16);
offset_info = data.slice(16);
offset_addr = data.slice(0, 8).readInt32LE();
offset_owner = data.slice(8, 16).readInt32LE();

function locateip(ip) {
  if (pattern.exec(ip)) {
    nip = _ip2int(ip);
  } else {
    return ['Error IP'];
  }
  record_min = 0;
  base_len = 64;
  record_max = offset_addr / base_len - 1;
  record_mid = (record_min + record_max) / 2;

  try {
    // allow locate to single record;
    while (record_max - record_min > -1) {
      mult_re_ba = record_mid * base_len;
      minip = bufferRev2intIp(offset_info.slice(mult_re_ba, mult_re_ba + 4));
      maxip = bufferRev2intIp(offset_info.slice(mult_re_ba + 4, mult_re_ba + 8));
      if (nip < minip) {
        record_max = record_mid - 1;
      } else if (nip == minip || (nip > minip && nip < maxip) || nip == maxip) {
        addr_begin = offset_info.slice(mult_re_ba + 8, mult_re_ba + 16).readInt32LE();
        addr_length = offset_info.slice(mult_re_ba + 16, mult_re_ba + 24).readInt32LE();
        owner_begin = offset_info.slice(mult_re_ba + 24, mult_re_ba + 32).readInt32LE();
        owner_length = offset_info.slice(mult_re_ba + 32, mult_re_ba + 40).readInt32LE();
        wgs_lon = offset_info.slice(mult_re_ba + 40, mult_re_ba + 52).toString('utf-8');
        wgs_lat = offset_info.slice(mult_re_ba + 52, mult_re_ba + 64).toString('utf-8');

        addr_bundle = offset_info.slice(addr_begin, addr_begin + addr_length).toString('utf-8');
        addr = addr_bundle.split('|');
        owner = offset_info.slice(owner_begin, owner_begin + owner_length).toString('utf-8');

        var res_list = [];

        tmp_list = [
          minip.toString(),
          maxip.toString(),
          addr[0],
          addr[1],
          addr[2],
          addr[3],
          addr[4],
          addr[5],
          addr[6],
          wgs_lon,
          wgs_lat,
          owner
        ];

        tmp_list.forEach(item => {
          if (item == null) {
            item = '';
          }
          item = item.replace(new RegExp('\0', 'g'), '');
          res_list.push(item);
        });
        return res_list;
      } else if (nip > maxip) {
        record_min = record_mid + 1;
      } else {
        return ['Error Case'];
      }
      record_mid = parseInt((record_min + record_max) / 2);
    }
  } catch (e) {
    console.log(e);
  }
}

function readSyncByRl(tips) {
  tips = tips || '> ';

  return new Promise(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(tips, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function main() {
  readSyncByRl('请输入IP地址：').then(res => {
    console.log(res);
    var locate = locateip(res);
    console.log(locate.join('|'));
    main();
  });
}
main();
