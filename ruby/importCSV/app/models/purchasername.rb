class Purchasername < ActiveRecord::Base
	require 'csv'
		
	# a class method import, with file pass through as an argument
	def self.import(file)
		file = file.path if file.is_a?(File)
		CSV.foreach(file.path, headers: true) do |row|
			#create a user for each row in the CSV file
			Purchasername.create! row.to_hash
		end
	end
end
