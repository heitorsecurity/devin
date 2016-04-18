class PurchasernameController < ApplicationController
 def index
	@names = Purchasername.all
  end

  def import
	Purchasername.import(params[:file])
	# after the import, redirect and let us know the method worked!
	redirect_to root_url, notice: "Activity Data imported!"
  end
end
