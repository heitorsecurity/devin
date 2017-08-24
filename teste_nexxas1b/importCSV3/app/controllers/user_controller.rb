class UserController < ApplicationController
 def index
	@users = User.all
  end

  def self.import
	User.import(params[:file])
	# after the import, redirect and let us know the method worked!
	redirect_to root_url, notice: "Activity Data imported!"
  end
end
