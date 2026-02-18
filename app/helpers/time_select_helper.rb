module TimeSelectHelper
  def time_select_fields(css_class, value = nil, hour_range: 0..23, minute_step: 5)
    h, m = value.present? ? value.split(':').map(&:to_i) : [nil, nil]

    # 分を次の5分刻みに切り上げ（移動時間は余裕を持たせる）
    if m.present? && (m % minute_step != 0)
      m = ((m.to_f / minute_step).ceil * minute_step).to_i
      if m >= 60
        h = (h || 0) + 1
        m = 0
      end
    end

    hour_options = (hour_range).map { |i| [i.to_s, i] }
    minute_options = (0...60).step(minute_step).map { |i| [format('%02d', i), i] }

    hour_select = select_tag(nil,
      options_for_select(hour_options, h),
      class: "time-select hour-select #{css_class}-hour",
      data: { time_role: 'hour', time_group: css_class })

    minute_select = select_tag(nil,
      options_for_select(minute_options, m),
      class: "time-select minute-select #{css_class}-minute",
      data: { time_role: 'minute', time_group: css_class })

    safe_join([hour_select, content_tag(:span, ':', class: 'time-colon'), minute_select])
  end

  # 日付文字列を表示用にフォーマット（"4-1" → "4月1日", "4月上旬" → "4月上旬"）
  def format_date_display(date_str)
    return nil if date_str.blank?
    return date_str if date_str.match?(/[上中下]旬/)
    date_str.gsub('-', '月') + '日'
  end
end
