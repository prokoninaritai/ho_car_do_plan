namespace :data do
  desc 'Export a single user (itineraries/starting_points/destinations/time_managements/stamps) to YAML'
  task :export_user, [:email] => :environment do |_, args|
    user = User.find_by!(email: args[:email])

    data = {
      user: user.attributes,
      itineraries: user.itineraries.includes(:starting_point, destinations: :time_management).map do |itinerary|
        {
          attributes: itinerary.attributes,
          starting_point: itinerary.starting_point&.attributes,
          destinations: itinerary.destinations.map do |destination|
            {
              attributes: destination.attributes,
              time_management: destination.time_management&.attributes
            }
          end
        }
      end,
      stamps: user.stamps.map(&:attributes)
    }

    path = Rails.root.join('tmp', "user_export_#{user.id}.yml")
    File.write(path, data.to_yaml)
    puts "Exported user #{user.email} to #{path}"
    puts "itineraries=#{data[:itineraries].size} stamps=#{data[:stamps].size}"
  end

  desc 'Import a previously exported user (file path) into the current environment DB'
  task :import_user, [:file] => :environment do |_, args|
    data = YAML.unsafe_load_file(args[:file])

    ActiveRecord::Base.transaction do
      user_attrs = data[:user].except('id', 'created_at', 'updated_at')
      user = User.find_or_initialize_by(email: user_attrs['email'])
      user.assign_attributes(user_attrs)
      user.save!(validate: false)

      data[:itineraries].each do |it_data|
        it_attrs = it_data[:attributes].except('id', 'user_id', 'created_at', 'updated_at')
        itinerary = user.itineraries.create!(it_attrs)

        if (sp_attrs = it_data[:starting_point])
          itinerary.create_starting_point!(sp_attrs.except('id', 'itinerary_id', 'created_at', 'updated_at'))
        end

        it_data[:destinations].each do |d_data|
          d_attrs = d_data[:attributes].except('id', 'itinerary_id', 'created_at', 'updated_at')
          destination = itinerary.destinations.create!(d_attrs)

          if (tm_attrs = d_data[:time_management])
            destination.create_time_management!(tm_attrs.except('id', 'destination_id', 'created_at', 'updated_at'))
          end
        end
      end

      data[:stamps].each do |s_attrs|
        attrs = s_attrs.except('id', 'user_id', 'created_at', 'updated_at')
        user.stamps.create!(attrs)
      end

      puts "Imported user #{user.email} (id=#{user.id}) itineraries=#{data[:itineraries].size} stamps=#{data[:stamps].size}"
    end
  end
end
