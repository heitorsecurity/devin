class User < ActiveRecord::Base
	require 'csv'
		
	# a class method import, with file pass through as an argument
	def self.import(file)
		#file = file.path if file.is_a?(File)
		SmarterCSV.process(file.path, headers: true) do |row|
			#create a user for each row in the CSV file
			User.create! row
		end
	end
end
