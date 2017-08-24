class CreateUsers < ActiveRecord::Migration
  def change
    create_table :users do |t|
      t.integer :steps
      t.float :distance
      t.integer :exercise
      t.float :sleep
      t.integer :calories

      t.timestamps null: false
    end
  end
end
