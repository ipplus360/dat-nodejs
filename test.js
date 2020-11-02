const Reader = require('awdb_nodejs').default;
const options = {
  // you can use options like `cache` or `watchForUpdates`
};

Reader.open('C:\\Users\\用户名\\Desktop\\****.awdb', options).then((reader) => {
  let result = reader.get('166.111.4.100');
  console.log(result);
  console.log(result.accuracy.toString());
});
