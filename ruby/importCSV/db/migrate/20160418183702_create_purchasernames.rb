class CreatePurchasernames < ActiveRecord::Migration
  def change
    create_table :purchasernames do |t|
      t.string :itemdescription
      t.float :itemprice
      t.integer :purchasecount
      t.string :merchantaddress
      t.string :merchantname

      t.timestamps null: false
    end
  end
end
