const db = require('../../adapters/mongo');
const _ = require('underscore')
const moment = require('moment')
const persianize = require('persianize')

const Schema = db.Schema

const schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    index: true
  },
  url: {
    type: String,
    index: true
  },
  site: String,
  thumbnail: String,
  duration: String,
  size: Number,
  title: String,
  extension: String,
  dimension: String,
  download: String,
  expire_at: Date,
  status: String,
  server_id: String,
  worker: String,
  formats: [Schema.Types.Mixed],
  note: String,
  status: String,
}, {
  timestamps: { created_at: 'created_at' }
});

const Media = db.model('Media', schema)

module.exports = {

  getStreamServer: function(server) {

    if (process.env.NODE_ENV != 'production') {
      return 'http://127.0.0.1:19001'
    }

    return 'http://' + server + '.savevideobot.com'
  },
  response: function(media) {

    if (media == null) {
      return null
    }

    // check media is expired
    // queued media are expired after 7 minutes
    const expired = moment().isAfter(moment(media.expire_at)) ||
      (media.status == 'queued' && moment().isAfter(moment(media.createdAt).add('7', 'minutes')))

    const streamServer = this.getStreamServer(media.server_id)

    let response = {
      id: media._id,
      server_id: media.server_id,
      url: media.url,
      site: media.site,
      title: media.title,
      thumbnail: media.thumbnail,
      thumbnailProxy: streamServer + '/thumbnail/' + media._id,
      duration: media.duration,
      size: media.size,
      created_at: media.createdAt,
      expire_at: media.expire_at,
      extension: media.extension,
      expired: expired || media.status == 'failed',
      worker: media.worker,
      note: media.note,
      status: expired ? 'expired' : media.status
    }

    if (media.formats.length == 0) {
      response = Object.assign(response, {
        extension: media.extension,
        dimension: media.dimension,
        size: media.size,
        download: media.download,
        stream: streamServer + '/stream/' + media._id + '/best'
      })
    }
    else {
      response.formats = _.map(media.formats, format => {
        format.stream = streamServer + '/stream/' + media._id + '/' + format.id
        return format
      })
    }

    return response
  },
  find: async function(criteria, start = 0, limit = null) {
    const list = Media
      .find(criteria)
      .lean()
      .select(['_id', 'url', 'title', 'note', 'status', 'createdAt'])
      .skip(~~start)

    if (limit != null) {
      list.limit(~~limit)
    }

    list.sort({ createdAt: -1 })

    return await list
  },
  live: async function(limit = 15) {
    const list = await Media
      .find({ status: 'ready' })
      .lean()
      .skip(0)
      .limit(limit)
      .sort({ _id: -1 })

    return list
      .filter(media => this.filterForbiddenWords(media.title))
      .map(media => this.response(media))
  },
  total: async function(criteria) {
    return await Media.count(criteria)
  },
  findById: async function(_id) {
    const media = await Media
      .findOne({ _id })
      .lean()

    return this.response(media)
  },
  findByUrl: async function(url) {
    const media = await Media
      .findOne({ url: url.trim() })
      .sort({ _id: -1 })
      .lean()

    return this.response(media)
  },
  update: async function(condition, attrs, multi = true) {
    return await Media.update(condition, attrs, { multi })
  },
  remove: async function(_id) {
    return await Media.remove({ _id })
  },
  create: async function(url, user_id, server_id, data) {
    const record = new Media({
      user_id,
      server_id,
      url: url.trim(),
      site: data.site,
      thumbnail: data.thumbnail,
      duration: data.duration,
      title: data.title,
      extension: data.extension,
      dimension: data.dimension,
      download: data.download,
      size: data.size,
      formats: data.formats,
      expire_at: moment().add(120, 'minutes').format(),
      worker: data.worker,
      status: data.status
    });

    const media = await record.save()
    return this.response(media)
  },
  filterForbiddenWords: function(title) {
    const words = ['سپاه', 'آخوند', 'خیمین', 'خامنه ای', 'پاسدار', 'کیر', 'کوص',
      'کون', 'خایه', 'جنده', 'جنتی', 'مکارم', 'مجاهدین', 'جنایت', 'دجال', 'نظام',
      'ولایت', 'ولایی', 'رفسنجانی', 'سکس', 'sex', 'کروبی', 'جنبش سبز', 'احمدی نژاد',
      'لاریجانی' ]

    return !_.some(words, word => {
      const normalizedTitle = persianize.convert().removeArabicChar(title).get()
      return normalizedTitle.match(word) != null
    })
  }
}
